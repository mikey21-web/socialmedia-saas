import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { BrandService } from '../../brand/brand.service';
import { LlmService } from '../llm/llm.service';
// LlmService is provided via ContentAgentModule
import { ContentService } from '../content/content.service';
import { fetchRssTrends } from './sources/rss.source';
import { scoreRelevance } from './pipeline/score-relevance';

@Injectable()
export class TrendService {
  private readonly logger = new Logger(TrendService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brandService: BrandService,
    private readonly llm: LlmService,
    private readonly contentService: ContentService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async runForAllTeams() {
    const profiles = await this.prisma.brandProfile.findMany({
      where: { onboardingComplete: true },
      select: { teamId: true, industry: true },
    });

    for (const profile of profiles) {
      try {
        await this.runForTeam(profile.teamId);
      } catch (err) {
        this.logger.error(`Trend scan failed for team ${profile.teamId}`, err);
      }
    }
  }

  async runForTeam(teamId: string): Promise<{ stored: number; converted: number }> {
    const brand = await this.brandService.getBrandContext(teamId);

    const raw = await fetchRssTrends(brand.industry);
    if (raw.length === 0) return { stored: 0, converted: 0 };

    const scored = await scoreRelevance(raw, brand, this.llm);

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    let stored = 0;

    for (const trend of scored) {
      const existing = await this.prisma.trendItem.findFirst({
        where: { teamId, url: trend.url },
      });
      if (existing) continue;

      await this.prisma.trendItem.create({
        data: {
          teamId,
          title: trend.title,
          summary: trend.summary.slice(0, 2000),
          url: trend.url,
          source: trend.source,
          relevanceScore: trend.relevanceScore,
          brandFitReason: trend.brandFitReason,
          pillar: trend.pillar,
          expiresAt,
        },
      });
      stored++;
    }

    // Auto-convert top-scoring trends (score >= 8) to content agent drafts
    const topTrends = scored.filter((t) => t.relevanceScore >= 8).slice(0, 3);
    let converted = 0;

    for (const trend of topTrends) {
      try {
        const result = await this.contentService.generate(teamId, {
          topic: trend.title,
          platforms: brand.platforms,
          intent: `reactive post about: ${trend.summary.slice(0, 300)}`,
        });

        await this.prisma.trendItem.updateMany({
          where: { teamId, url: trend.url },
          data: {
            status: 'converted',
            convertedPostId: result.postIds[0] ?? null,
          },
        });
        converted++;
      } catch (err) {
        this.logger.warn(`Failed to convert trend "${trend.title}"`, err);
      }
    }

    this.logger.log(`Team ${teamId}: ${stored} trends stored, ${converted} converted`);
    return { stored, converted };
  }

  async getFeed(
    teamId: string,
    opts: { status?: string; limit?: number; page?: number },
  ) {
    const limit = opts.limit ?? 20;
    const page = opts.page ?? 1;
    const skip = (page - 1) * limit;

    const where: any = {
      teamId,
      expiresAt: { gt: new Date() },
    };
    if (opts.status) where.status = opts.status;

    const [items, total] = await Promise.all([
      this.prisma.trendItem.findMany({
        where,
        orderBy: { relevanceScore: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.trendItem.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async dismiss(teamId: string, trendId: string) {
    return this.prisma.trendItem.updateMany({
      where: { id: trendId, teamId },
      data: { status: 'dismissed' },
    });
  }

  async convertToPost(teamId: string, trendId: string) {
    const trend = await this.prisma.trendItem.findFirst({
      where: { id: trendId, teamId },
    });
    if (!trend) throw new Error('Trend not found');

    const brand = await this.brandService.getBrandContext(teamId);
    const result = await this.contentService.generate(teamId, {
      topic: trend.title,
      platforms: brand.platforms,
      intent: `reactive post about: ${trend.summary.slice(0, 300)}`,
    });

    await this.prisma.trendItem.update({
      where: { id: trendId },
      data: { status: 'converted', convertedPostId: result.postIds[0] ?? null },
    });

    return result;
  }
}
