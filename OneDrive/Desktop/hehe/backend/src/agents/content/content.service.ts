import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BrandService } from '../../brand/brand.service';
import { LlmService } from '../llm/llm.service';
import { EnrichedContext, GenerateInput, StepResult } from './types';
import { ideate } from './pipeline/ideate';
import { pickBestAngle } from './pipeline/pick-angle';
import { adaptForAllPlatforms } from './pipeline/adapt-platform';
import { checkCompliance } from './pipeline/compliance-check';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brandService: BrandService,
    private readonly llm: LlmService,
  ) {}

  private async gatherEnrichedContext(teamId: string, platforms: string[]): Promise<EnrichedContext> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [publishedPosts, trendSignals, competitorTracks] = await Promise.all([
      this.prisma.post.findMany({
        where: { teamId, status: 'published', deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
        orderBy: { impressions: 'desc' },
        take: 30,
        select: { title: true, content: true, impressions: true, reach: true, platforms: { select: { platform: true } } },
      }),
      this.prisma.trendSignal.findMany({
        where: { platform: { in: platforms.length ? platforms : undefined }, expiresAt: { gt: now } },
        orderBy: { popularity: 'desc' },
        take: 10,
      }),
      this.prisma.competitorTrack.findMany({
        where: { teamId, isActive: true },
        include: {
          posts: {
            where: { postedAt: { gte: thirtyDaysAgo } },
            orderBy: { engagementRate: 'desc' },
            take: 5,
          },
        },
      }),
    ]);

    const topPerformers = publishedPosts.slice(0, 5).map(p => ({
      title: p.title || p.content.slice(0, 60),
      impressions: p.impressions,
      platform: p.platforms[0]?.platform,
    }));

    const avgImpressions = publishedPosts.length
      ? publishedPosts.reduce((s, p) => s + p.impressions, 0) / publishedPosts.length
      : 0;

    const flops = publishedPosts
      .filter(p => p.impressions < avgImpressions * 0.3)
      .slice(0, 3)
      .map(p => ({
        title: p.title || p.content.slice(0, 60),
        impressions: p.impressions,
        reason: p.impressions === 0 ? 'zero reach' : 'well below average',
      }));

    const competitorInsights = competitorTracks.map(ct => ({
      handle: ct.handle,
      platform: ct.platform,
      topTopics: ct.posts.slice(0, 3).map(cp => cp.caption.slice(0, 50)),
      engagementRate: ct.posts[0]?.engagementRate
        ? `${ct.posts[0].engagementRate.toFixed(1)}%`
        : 'unknown',
      strengths: [] as string[],
      weaknesses: [] as string[],
      recentContent: ct.posts.slice(0, 3).map(cp => cp.caption.slice(0, 80)),
    }));

    let winningPatterns;
    if (publishedPosts.length >= 5) {
      const topContent = publishedPosts.slice(0, 10);
      const topWords = this.extractFrequentWords(topContent.map(p => p.content));
      winningPatterns = {
        topics: topWords.slice(0, 5),
        formats: this.detectFormats(topContent.map(p => p.content)),
        timings: [],
        hashtags: this.extractHashtags(topContent.map(p => p.content)),
      };
    }

    return {
      winningPatterns,
      competitorInsights,
      trendSignals: trendSignals.map(t => ({
        platform: t.platform,
        signalType: t.signalType,
        value: t.value,
        popularity: t.popularity,
        velocity: t.velocity,
      })),
      recentTopPerformers: topPerformers,
      recentFlops: flops,
    };
  }

  private extractFrequentWords(texts: string[]): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'this', 'that', 'it', 'its', 'our', 'your', 'we', 'you', 'i', 'my', 'me', 'not', 'no', 'so', 'if', 'how', 'what', 'when', 'do', 'does', 'has', 'have', 'had', 'be', 'been', 'can', 'will', 'just', 'about', 'up', 'out', 'all']);
    const freq: Record<string, number> = {};
    for (const text of texts) {
      const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
      for (const w of words) {
        if (w.length > 3 && !stopWords.has(w)) {
          freq[w] = (freq[w] ?? 0) + 1;
        }
      }
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);
  }

  private detectFormats(texts: string[]): string[] {
    const formats: string[] = [];
    const joined = texts.join('\n');
    if (/\d+\.\s/.test(joined)) formats.push('numbered-lists');
    if (/POV:|pov:/i.test(joined)) formats.push('POV');
    if (/\?/.test(joined)) formats.push('questions');
    if (/story|told|happened|remember/i.test(joined)) formats.push('storytelling');
    if (joined.split('\n').filter(l => l.startsWith('-') || l.startsWith('•')).length > 3) formats.push('bullet-points');
    if (formats.length === 0) formats.push('short-form');
    return formats;
  }

  private extractHashtags(texts: string[]): string[] {
    const tags: Record<string, number> = {};
    for (const text of texts) {
      const matches = text.match(/#\w+/g) ?? [];
      for (const m of matches) {
        tags[m.toLowerCase()] = (tags[m.toLowerCase()] ?? 0) + 1;
      }
    }
    return Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  }

  async generate(teamId: string, input: GenerateInput) {
    const brand = await this.brandService.getBrandContext(teamId);
    const steps: StepResult[] = [];
    const platforms = input.platforms.length
      ? input.platforms
      : brand.platforms;

    if (platforms.length === 0) {
      throw new NotFoundException('No platforms configured — update your brand profile');
    }

    const enrichedStart = new Date();
    const enriched = await this.gatherEnrichedContext(teamId, platforms);
    steps.push({
      name: 'gather_intelligence',
      startedAt: enrichedStart,
      completedAt: new Date(),
      durationMs: Date.now() - enrichedStart.getTime(),
      output: {
        topPerformers: enriched.recentTopPerformers.length,
        flops: enriched.recentFlops.length,
        trends: enriched.trendSignals.length,
        competitors: enriched.competitorInsights.length,
      },
    });

    const run = await this.prisma.agentRun.create({
      data: {
        teamId,
        agentType: 'content',
        status: 'running',
        input: input as any,
      },
    });

    try {
      const ideationStart = new Date();
      const ideationResult = await ideate(
        { topic: input.topic, intent: input.intent },
        brand,
        this.llm,
        enriched,
        platforms[0],
      );
      steps.push({
        name: 'ideation',
        startedAt: ideationStart,
        completedAt: new Date(),
        durationMs: Date.now() - ideationStart.getTime(),
        output: ideationResult,
      });

      const pickStart = new Date();
      const bestAngle = pickBestAngle(ideationResult.angles);
      steps.push({
        name: 'pick_angle',
        startedAt: pickStart,
        completedAt: new Date(),
        durationMs: Date.now() - pickStart.getTime(),
        output: bestAngle,
      });

      const adaptStart = new Date();
      const drafts = await adaptForAllPlatforms(platforms, bestAngle, brand, this.llm, enriched);
      steps.push({
        name: 'adapt_platforms',
        startedAt: adaptStart,
        completedAt: new Date(),
        durationMs: Date.now() - adaptStart.getTime(),
        output: drafts,
      });

      const complianceStart = new Date();
      const complianceResults = drafts.map((draft) => ({
        platform: draft.platform,
        ...checkCompliance(draft, brand),
      }));
      steps.push({
        name: 'compliance_check',
        startedAt: complianceStart,
        completedAt: new Date(),
        durationMs: Date.now() - complianceStart.getTime(),
        output: complianceResults,
      });

      const brandProfile = await this.prisma.brandProfile.findUnique({
        where: { teamId },
        select: { autonomousMode: true },
      });
      const isAutonomous = brandProfile?.autonomousMode ?? false;

      const postIds: string[] = [];
      for (const draft of drafts) {
        const compliance = complianceResults.find((c) => c.platform === draft.platform);
        const finalCaption = compliance?.correctedCaption ?? draft.fullCaption;
        const wasTrimmed = finalCaption !== draft.fullCaption;

        const autonomousScheduledAt = isAutonomous
          ? (() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              d.setHours(9, 0, 0, 0);
              return d;
            })()
          : null;

        const post = await this.prisma.post.create({
          data: {
            teamId,
            title: draft.hook,
            content: finalCaption,
            status: isAutonomous ? 'scheduled' : 'awaiting_approval',
            scheduledAt: autonomousScheduledAt,
            generatedBy: 'content_agent',
            agentRunId: run.id,
            generationContext: {
              topic: input.topic,
              intent: input.intent ?? null,
              angle: JSON.parse(JSON.stringify(bestAngle)),
              runId: run.id,
              platform: draft.platform,
              autonomous: isAutonomous,
              compliance: compliance ? JSON.parse(JSON.stringify(compliance)) : null,
              wasTrimmed,
              originalLength: draft.fullCaption.length,
              finalLength: finalCaption.length,
            },
            platforms: {
              create: {
                platform: draft.platform,
                status: 'pending',
              },
            },
          },
        });
        postIds.push(post.id);

        if (wasTrimmed) {
          this.logger.debug(
            `[${draft.platform}] Caption trimmed from ${draft.fullCaption.length} to ${finalCaption.length} chars`,
          );
        }
      }

      await this.prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          steps: steps as any,
          output: { postIds, angle: JSON.parse(JSON.stringify(bestAngle)) },
        },
      });

      return {
        runId: run.id,
        postIds,
        angle: bestAngle,
        platforms: drafts.map((d) => d.platform),
        steps: steps.map((s) => ({
          name: s.name,
          durationMs: s.durationMs,
        })),
      };
    } catch (error) {
      await this.prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: error instanceof Error ? error.message : String(error),
          steps: steps as any,
        },
      });
      throw error;
    }
  }

  async regenerate(teamId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, teamId },
      include: { platforms: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const context = post.generationContext as any;
    if (!context?.topic || !context?.angle) {
      throw new NotFoundException('Post was not agent-generated');
    }

    const brand = await this.brandService.getBrandContext(teamId);
    const platform = post.platforms[0]?.platform ?? 'instagram';
    const enriched = await this.gatherEnrichedContext(teamId, [platform]);

    const { adaptForPlatform } = await import('./pipeline/adapt-platform');
    const draft = await adaptForPlatform(platform, context.angle, brand, this.llm, enriched);
    const compliance = checkCompliance(draft, brand);
    const finalCaption = compliance.correctedCaption ?? draft.fullCaption;

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        title: draft.hook,
        content: finalCaption,
        status: 'awaiting_approval',
        generationContext: {
          ...context,
          regeneratedAt: new Date().toISOString(),
          compliance,
          wasTrimmed: finalCaption !== draft.fullCaption,
          originalLength: draft.fullCaption.length,
          finalLength: finalCaption.length,
        },
      },
    });

    return updated;
  }

  async refine(teamId: string, postId: string, feedback: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, teamId },
      include: { platforms: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const brand = await this.brandService.getBrandContext(teamId);
    const platform = post.platforms[0]?.platform ?? 'instagram';

    const prompt = `You are refining a social media post for ${brand.brandName}.

CURRENT POST (${platform}):
"${post.content}"

USER FEEDBACK: ${feedback}

BRAND VOICE:
- Tone: ${brand.voice.tone}
- Traits: ${brand.voice.traits.join(', ')}
- Formality: ${brand.voice.formality}/10
- Never use: ${brand.voice.neverWords.join(', ') || 'none'}

Apply the feedback while maintaining brand voice. Return the refined post.

OUTPUT JSON ONLY:
{
  "hook": "first line",
  "body": "main content",
  "cta": "call to action",
  "hashtags": ["tag1"],
  "fullCaption": "complete refined post"
}`;

    const refined = await this.llm.completeJson<{
      hook: string;
      fullCaption: string;
    }>(prompt);

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        title: refined.hook,
        content: refined.fullCaption,
        status: 'awaiting_approval',
        generationContext: {
          ...(post.generationContext as any),
          refinedAt: new Date().toISOString(),
          feedback,
        },
      },
    });

    return updated;
  }
}