import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmService } from '../../agents/llm/llm.service';
import { AgentRunLoggerService } from '../agent-run-logger.service';
import { GoogleTrendsService } from './google-trends.service';

@Injectable()
export class TrendMonitorService {
  private readonly logger = new Logger(TrendMonitorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly runLogger: AgentRunLoggerService,
    private readonly googleTrends: GoogleTrendsService,
  ) {}

  @Cron('0 * * * *')
  async hourlyScan(): Promise<void> {
    this.logger.log('Starting hourly trend scan');
    await this.scanAllSources();
    this.logger.log('Hourly trend scan completed');
  }

  async scanAllSources(): Promise<{ created: number }> {
    const before = await this.prisma.trendSignal.count();

    // Real data sources first, LLM fallback for platforms without public APIs
    await Promise.allSettled([
      this.googleTrends.scanAndStore(),  // REAL Google Trends data
      this.scanXTrends(),                // LLM-generated (needs real API for production)
      this.scanInstagramTrends(),        // LLM-generated (no public trends API)
      this.scanTikTokTrends(),           // LLM-generated (needs Research API)
    ]);

    const after = await this.prisma.trendSignal.count();
    return { created: Math.max(0, after - before) };
  }

  private async scanXTrends(): Promise<void> {
    await this.generateTrendSignals('x', [
      'hashtag',
      'topic',
    ]);
  }

  private async scanInstagramTrends(): Promise<void> {
    await this.generateTrendSignals('instagram', [
      'hashtag',
      'audio',
      'format',
    ]);
  }

  private async scanTikTokTrends(): Promise<void> {
    await this.generateTrendSignals('tiktok', [
      'hashtag',
      'audio',
      'format',
    ]);
  }

  private async generateTrendSignals(platform: string, signalTypes: string[]): Promise<void> {
    const prompt = `You are a social media trend analyst. Generate realistic current trending signals for ${platform}.

Signal types to include: ${signalTypes.join(', ')}

Return JSON:
{
  "signals": [
    {
      "signalType": "hashtag",
      "value": "#TrendingTopic",
      "popularity": 8500,
      "velocity": 1.5,
      "category": "technology",
      "metadata": {}
    }
  ]
}

Generate 5-8 realistic trending signals.`;

    try {
      const result = await this.llm.completeJson<{
        signals: Array<{
          signalType: string;
          value: string;
          popularity: number;
          velocity: number;
          category: string;
          metadata: Record<string, unknown>;
        }>;
      }>(prompt, { maxTokens: 1024 });

      const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours

      for (const signal of result.signals ?? []) {
        await this.prisma.trendSignal.create({
          data: {
            platform,
            signalType: signal.signalType,
            value: signal.value,
            metadata: JSON.parse(JSON.stringify(signal.metadata ?? {})),
            popularity: signal.popularity ?? 0,
            velocity: signal.velocity ?? 0,
            category: signal.category,
            expiresAt,
          },
        });
      }
    } catch (err) {
      this.logger.error(`Failed to scan ${platform} trends`, err);
    }
  }

  async getRelevantTrends(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { verticalProfileId: true },
    });

    let verticalCategory: string | undefined;
    if (team?.verticalProfileId) {
      const vp = await this.prisma.verticalProfile.findUnique({
        where: { id: team.verticalProfileId },
        select: { slug: true, name: true },
      });
      verticalCategory = vp?.slug;
    }

    const now = new Date();
    return this.prisma.trendSignal.findMany({
      where: {
        expiresAt: { gt: now },
        ...(verticalCategory ? { category: verticalCategory } : {}),
      },
      orderBy: [{ popularity: 'desc' }, { velocity: 'desc' }],
      take: 20,
    });
  }

  async generateContentFromTrend(input: {
    trendSignalId: string;
    teamId: string;
    brandVoiceId: string;
  }) {
    const signal = await this.prisma.trendSignal.findUniqueOrThrow({
      where: { id: input.trendSignalId },
    });

    const brandVoice = await this.prisma.brandVoice.findUnique({
      where: { id: input.brandVoiceId },
    });

    const tone = (brandVoice?.toneAttributes as Record<string, number>) ?? {};

    const prompt = `Generate a social media post that rides this trending topic.

Trend: "${signal.value}" (${signal.signalType} on ${signal.platform}, popularity: ${signal.popularity})
Brand voice: ${brandVoice?.name ?? 'default'}, formality: ${tone.formality ?? 5}/10

Return JSON:
{
  "content": "post text incorporating the trend",
  "hashtags": ["#tag1"],
  "relevanceScore": 0.85,
  "platform": "${signal.platform}"
}`;

    const result = await this.llm.completeJson<{
      content: string;
      hashtags: string[];
      relevanceScore: number;
      platform: string;
    }>(prompt, { maxTokens: 512 });

    return {
      post: result,
      relevanceScore: result.relevanceScore ?? 0.5,
    };
  }

  async getTrendFeed(limit = 50) {
    return this.prisma.trendSignal.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
