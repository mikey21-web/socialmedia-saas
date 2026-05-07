import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TwitterApi } from 'twitter-api-v2';
import { PrismaService } from '../../prisma/prisma.service';
import { BrandService } from '../../brand/brand.service';
import { LlmService } from '../llm/llm.service';
import { generateDigest, WeeklyDigest } from './pipeline/generate-digest';
import { CompetitorSnapshotData } from './prompts/digest.prompt';

@Injectable()
export class CompetitorService {
  private readonly logger = new Logger(CompetitorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brandService: BrandService,
    private readonly llm: LlmService,
  ) {}

  @Cron('0 7 * * 1') // Every Monday at 7am — weekly digest
  async runWeeklyDigestForAllTeams() {
    const profiles = await this.prisma.brandProfile.findMany({
      where: { onboardingComplete: true },
      select: { teamId: true },
    });

    for (const profile of profiles) {
      try {
        await this.fetchAndSnapshotCompetitors(profile.teamId);
      } catch (err) {
        this.logger.error(`Competitor snapshot failed for team ${profile.teamId}`, err);
      }
    }
  }

  async fetchAndSnapshotCompetitors(teamId: string): Promise<{ snapshots: number }> {
    const competitors = await this.prisma.competitor.findMany({
      where: { brandProfileId: { in: await this.getProfileId(teamId) }, isActive: true },
    });

    let snapshots = 0;

    for (const competitor of competitors) {
      const handles = competitor.handles as Record<string, string>;
      const twitterHandle = handles['twitter'] ?? handles['x'];

      if (twitterHandle && process.env.TWITTER_BEARER_TOKEN) {
        try {
          const posts = await this.fetchTwitterPosts(twitterHandle.replace('@', ''));
          await this.prisma.competitorSnapshot.create({
            data: {
              competitorId: competitor.id,
              platform: 'twitter',
              postsCount: posts.length,
              topPosts: posts as any,
            },
          });
          snapshots++;
        } catch (err) {
          this.logger.warn(`Twitter fetch failed for ${twitterHandle}`, err);
        }
      }

      await this.prisma.competitor.update({
        where: { id: competitor.id },
        data: { lastScrapedAt: new Date() },
      });
    }

    return { snapshots };
  }

  private async getProfileId(teamId: string): Promise<string[]> {
    const profile = await this.prisma.brandProfile.findUnique({
      where: { teamId },
      select: { id: true },
    });
    return profile ? [profile.id] : [];
  }

  private async fetchTwitterPosts(
    username: string,
  ): Promise<Array<{ content: string; likes: number; comments: number; url: string }>> {
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!);
    const user = await client.v2.userByUsername(username);
    if (!user.data) return [];

    const timeline = await client.v2.userTimeline(user.data.id, {
      max_results: 10,
      'tweet.fields': ['public_metrics', 'created_at'],
    });

    return (timeline.data.data ?? []).map((tweet) => ({
      content: tweet.text,
      likes: tweet.public_metrics?.like_count ?? 0,
      comments: tweet.public_metrics?.reply_count ?? 0,
      url: `https://twitter.com/${username}/status/${tweet.id}`,
    }));
  }

  async getDigest(teamId: string): Promise<WeeklyDigest> {
    const brand = await this.brandService.getBrandContext(teamId);

    const profileIds = await this.getProfileId(teamId);
    const competitors = await this.prisma.competitor.findMany({
      where: { brandProfileId: { in: profileIds }, isActive: true },
      include: {
        snapshots: {
          orderBy: { capturedAt: 'desc' },
          take: 1,
        },
      },
    });

    const snapshotData: CompetitorSnapshotData[] = competitors.flatMap((c) =>
      c.snapshots.map((s) => ({
        name: c.name,
        platform: s.platform,
        topPosts: (s.topPosts as any[]) ?? [],
      })),
    );

    return generateDigest(snapshotData, brand, this.llm);
  }

  async getFeed(teamId: string, opts: { page?: number; limit?: number }) {
    const limit = opts.limit ?? 10;
    const page = opts.page ?? 1;
    const skip = (page - 1) * limit;

    const profileIds = await this.getProfileId(teamId);

    const [snapshots, total] = await Promise.all([
      this.prisma.competitorSnapshot.findMany({
        where: { competitor: { brandProfileId: { in: profileIds } } },
        include: { competitor: { select: { name: true } } },
        orderBy: { capturedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.competitorSnapshot.count({
        where: { competitor: { brandProfileId: { in: profileIds } } },
      }),
    ]);

    return { snapshots, total, page, limit };
  }

  async manualSnapshot(
    teamId: string,
    competitorId: string,
    platform: string,
    topPosts: Array<{ content: string; likes?: number; comments?: number }>,
  ) {
    const profileIds = await this.getProfileId(teamId);
    const competitor = await this.prisma.competitor.findFirst({
      where: { id: competitorId, brandProfileId: { in: profileIds } },
    });
    if (!competitor) throw new Error('Competitor not found');

    return this.prisma.competitorSnapshot.create({
      data: {
        competitorId,
        platform,
        postsCount: topPosts.length,
        topPosts: topPosts as any,
      },
    });
  }
}
