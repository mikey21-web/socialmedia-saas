import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LlmService } from '../../../agents/llm/llm.service';
import { AgentRunLoggerService } from '../../agent-run-logger.service';
import { ContentBrief } from '../../types';

interface GenerateStrategyInput {
  teamId: string;
  brandVoiceId: string;
  verticalSlug: string;
  goals: { followers?: number; engagement?: number; leads?: number };
  platforms: string[];
  durationDays?: number;
}

interface ContentPillar {
  topic: string;
  percentage: number;
  examples: string[];
}

interface CampaignPlanItem {
  name: string;
  dates: string;
  theme: string;
  postsCount: number;
}

@Injectable()
export class StrategistService {
  private readonly logger = new Logger(StrategistService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly runLogger: AgentRunLoggerService,
  ) {}

  async generateStrategy(input: GenerateStrategyInput) {
    const start = Date.now();
    const duration = input.durationDays ?? 90;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

    const [brandVoice, vertical, recentPosts] = await Promise.all([
      this.prisma.brandVoice.findUnique({ where: { id: input.brandVoiceId } }),
      this.prisma.verticalProfile.findUnique({ where: { slug: input.verticalSlug } }),
      this.prisma.post.findMany({
        where: { teamId: input.teamId, status: 'published', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { title: true, content: true, impressions: true, reach: true },
      }),
    ]);

    const voiceContext = brandVoice
      ? `Brand: ${brandVoice.name}, Tone: ${JSON.stringify(brandVoice.toneAttributes)}`
      : 'No brand voice configured';

    const verticalContext = vertical
      ? `Industry: ${vertical.name}, Priorities: ${JSON.stringify(vertical.contentPriorities)}`
      : 'Generic business';

    const performanceSummary = recentPosts.length
      ? `Top performing content topics: ${recentPosts.slice(0, 5).map(p => p.title || p.content.slice(0, 60)).join('; ')}`
      : 'No past performance data available';

    const prompt = `You are a marketing strategist. Generate a ${duration}-day content strategy.

Context:
- ${voiceContext}
- ${verticalContext}
- Platforms: ${input.platforms.join(', ')}
- Goals: followers=${input.goals.followers ?? 'N/A'}, engagement=${input.goals.engagement ?? 'N/A'}%, leads=${input.goals.leads ?? 'N/A'}
- ${performanceSummary}

Return JSON:
{
  "name": "strategy name",
  "contentMix": { "educational": 50, "promotional": 20, "trending": 15, "ugc": 10, "behind_scenes": 5 },
  "pillars": [{ "topic": "...", "percentage": 25, "examples": ["...", "..."] }],
  "postingCadence": { "platform": "frequency" },
  "campaignPlan": [{ "name": "...", "dates": "...", "theme": "...", "postsCount": 10 }]
}`;

    const result = await this.llm.completeJson<{
      name: string;
      contentMix: Record<string, number>;
      pillars: ContentPillar[];
      postingCadence: Record<string, string>;
      campaignPlan: CampaignPlanItem[];
    }>(prompt, { maxTokens: 2048 });

    const strategy = await this.prisma.contentStrategy.create({
      data: {
        teamId: input.teamId,
        name: result.name || `${duration}-Day Strategy`,
        startDate,
        endDate,
        contentMix: JSON.parse(JSON.stringify(result.contentMix)),
        pillars: JSON.parse(JSON.stringify(result.pillars)),
        goals: JSON.parse(JSON.stringify(input.goals)),
        platforms: input.platforms,
        postingCadence: JSON.parse(JSON.stringify(result.postingCadence)),
        campaignPlan: JSON.parse(JSON.stringify(result.campaignPlan)),
        status: 'active',
      },
    });

    await this.runLogger.log({
      teamId: input.teamId,
      agentRole: 'strategist',
      triggerType: 'manual',
      input: input as unknown as Record<string, unknown>,
      output: { strategyId: strategy.id },
      tokensUsed: 2500,
      durationMs: Date.now() - start,
      status: 'success',
    });

    return strategy;
  }

  async refineStrategy(strategyId: string) {
    const strategy = await this.prisma.contentStrategy.findUniqueOrThrow({
      where: { id: strategyId },
    });

    const recentPosts = await this.prisma.post.findMany({
      where: { teamId: strategy.teamId, status: 'published', deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { title: true, content: true, impressions: true, reach: true },
    });

    const prompt = `Refine this marketing strategy based on recent performance.

Current strategy: ${JSON.stringify({ pillars: strategy.pillars, contentMix: strategy.contentMix, campaignPlan: strategy.campaignPlan })}

Recent performance:
${recentPosts.map(p => `- "${p.title || p.content.slice(0, 60)}": ${p.impressions} impressions, ${p.reach} reach`).join('\n')}

Return the same JSON structure with adjusted values. Keep what works, change what doesn't.`;

    const result = await this.llm.completeJson<{
      contentMix: Record<string, number>;
      pillars: ContentPillar[];
      campaignPlan: CampaignPlanItem[];
    }>(prompt, { maxTokens: 2048 });

    return this.prisma.contentStrategy.update({
      where: { id: strategyId },
      data: {
        contentMix: JSON.parse(JSON.stringify(result.contentMix)),
        pillars: JSON.parse(JSON.stringify(result.pillars)),
        campaignPlan: JSON.parse(JSON.stringify(result.campaignPlan)),
      },
    });
  }

  async generateWeeklyBriefs(strategyId: string): Promise<ContentBrief[]> {
    const strategy = await this.prisma.contentStrategy.findUniqueOrThrow({
      where: { id: strategyId },
    });

    const pillars = strategy.pillars as unknown as ContentPillar[];
    const cadence = strategy.postingCadence as Record<string, string>;

    const prompt = `Generate 7 days of content briefs based on this strategy.

Pillars: ${JSON.stringify(pillars)}
Platforms: ${strategy.platforms.join(', ')}
Cadence: ${JSON.stringify(cadence)}

Return JSON: { "briefs": [{ "date": "2026-05-09", "pillarTopic": "...", "contentType": "educational", "platform": "instagram", "targetWordCount": 150, "notes": "..." }] }`;

    const result = await this.llm.completeJson<{ briefs: ContentBrief[] }>(prompt, { maxTokens: 2048 });
    return result.briefs ?? [];
  }

  async getCurrentStrategy(teamId: string) {
    return this.prisma.contentStrategy.findFirst({
      where: { teamId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDailyBriefs(strategyId: string): Promise<ContentBrief[]> {
    const allBriefs = await this.generateWeeklyBriefs(strategyId);
    const today = new Date().toISOString().slice(0, 10);
    return allBriefs.filter(b => b.date === today);
  }

  async listStrategies(teamId: string) {
    return this.prisma.contentStrategy.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
