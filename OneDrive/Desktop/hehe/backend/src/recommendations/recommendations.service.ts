import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../agents/llm/llm.service';
import Redis from 'ioredis';

interface Recommendation {
  id: string;
  caption: string;
  platforms: string[];
  reasoning: string;
  trendKeyword?: string;
  relatedPostTitle?: string;
}

interface CacheEntry {
  recommendations: Recommendation[];
  timestamp: number;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly redis: Redis | null;
  private readonly CACHE_TTL = 60 * 60 * 24;

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {
    const redisUrl = process.env.REDIS_URL;
    this.redis = redisUrl ? new Redis(redisUrl) : null;
  }

  async generateRecommendations(teamId: string, count = 8): Promise<Recommendation[]> {
    const cached = await this.getCache(teamId);
    if (cached) {
      return cached.recommendations;
    }
    const recommendations = await this.buildRecommendationsFromContext(teamId, count);
    await this.setCache(teamId, recommendations);
    return recommendations;
  }

  async getRecommendations(teamId: string): Promise<{ recommendations: Recommendation[]; cached: boolean; stale: boolean }> {
    const cached = await this.getCache(teamId);
    if (cached) {
      const stale = this.isStale(cached);
      return { recommendations: cached.recommendations, cached: true, stale };
    }
    const recommendations = await this.buildRecommendationsFromContext(teamId, 8);
    await this.setCache(teamId, recommendations);
    return { recommendations, cached: false, stale: false };
  }

  async refreshRecommendations(teamId: string): Promise<Recommendation[]> {
    const recommendations = await this.buildRecommendationsFromContext(teamId, 8);
    await this.setCache(teamId, recommendations);
    return recommendations;
  }

  private async buildRecommendationsFromContext(teamId: string, count: number): Promise<Recommendation[]> {
    const [brand, topPosts, topTrends] = await Promise.all([
      this.getBrandContext(teamId),
      this.getTopPerformingPosts(teamId, 5),
      this.getTopTrends(teamId, 5),
    ]);

    const context = `
BRAND: ${brand.brandName} (${brand.industry})
VOICE: ${brand.voiceTone}, traits: ${brand.voiceTraits.join(', ')}
AUDIENCE: ${brand.audienceAge}, interests: ${brand.audienceInterests.join(', ')}
PLATFORMS: ${brand.platforms.join(', ')}
NEVER USE: ${brand.neverWords.join(', ') || 'none'}

TOP PERFORMING POSTS (last 30 days):
${topPosts.map((p, i) => `${i+1}. "${p.title}" - ${p.engagement} engagements`).join('\n')}

TRENDING TOPICS:
${topTrends.map((t, i) => `${i+1}. ${t.title} (score: ${t.relevanceScore})`).join('\n')}
`;

    const prompt = `${context}

Generate ${count} personalized post recommendations for this brand.

Rules:
- Each caption: 200-300 chars, platform-specific, match brand voice
- Include reasoning (1 sentence per recommendation)
- Distribute across: ${brand.platforms.join(', ')}
- 3-5 recommendations should reference current trends
- 2-3 should reference/extend top-performing posts
- Never use words: ${brand.neverWords.join(', ')}

OUTPUT JSON ONLY (array of { id, caption, platforms, reasoning, trendKeyword?, relatedPostTitle? }):
`;

    const result = await this.llm.completeJson<Array<{
      id: string;
      caption: string;
      platforms: string[];
      reasoning: string;
      trendKeyword?: string;
      relatedPostTitle?: string;
    }>>(prompt);

    return result.map((r, i) => ({ ...r, id: `rec-${Date.now()}-${i}` }));
  }

  private async getTopPerformingPosts(teamId: string, limit: number): Promise<any[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        teamId,
        createdAt: { gte: thirtyDaysAgo },
        eventType: { in: ['impression', 'engagement', 'click', 'like', 'share', 'comment'] },
      },
      select: { postId: true, eventType: true, value: true },
    });

    const engagementMap = new Map<string, number>();
    for (const event of events) {
      const current = engagementMap.get(event.postId) ?? 0;
      const value = typeof event.value === 'number' ? event.value : 1;
      engagementMap.set(event.postId, current + value);
    }

    const sorted = [...engagementMap.entries()].sort((a, b) => b[1] - a[1]);
    const topPostIds = sorted.slice(0, limit).map(([id]) => id);

    const posts = await this.prisma.post.findMany({
      where: { id: { in: topPostIds } },
      select: { id: true, title: true },
    });

    return topPostIds.map((postId) => {
      const post = posts.find((p) => p.id === postId);
      const engagement = engagementMap.get(postId) ?? 0;
      return { title: post?.title ?? 'Untitled', engagement };
    });
  }

  private async getTopTrends(teamId: string, limit: number): Promise<any[]> {
    const now = new Date();
    const trends = await this.prisma.trendItem.findMany({
      where: {
        teamId,
        status: { not: 'dismissed' },
        expiresAt: { gt: now },
      },
      orderBy: { relevanceScore: 'desc' },
      take: limit,
      select: { title: true, relevanceScore: true },
    });
    return trends;
  }

  private async getBrandContext(teamId: string): Promise<any> {
    const brand = await this.prisma.brandProfile.findUnique({
      where: { teamId },
      select: {
        brandName: true,
        industry: true,
        voiceTone: true,
        voiceTraits: true,
        audienceAge: true,
        audienceInterests: true,
        platforms: true,
        neverWords: true,
      },
    });

    if (!brand) {
      return {
        brandName: 'Your Brand',
        industry: 'general',
        voiceTone: 'professional',
        voiceTraits: [],
        audienceAge: '25-34',
        audienceInterests: [],
        platforms: ['twitter', 'linkedin', 'instagram'],
        neverWords: [],
      };
    }

    return {
      brandName: brand.brandName,
      industry: brand.industry,
      voiceTone: brand.voiceTone,
      voiceTraits: brand.voiceTraits ?? [],
      audienceAge: brand.audienceAge,
      audienceInterests: brand.audienceInterests ?? [],
      platforms: brand.platforms ?? ['twitter', 'linkedin', 'instagram'],
      neverWords: brand.neverWords ?? [],
    };
  }

  private getCacheKey(teamId: string): string {
    return `recommendations:${teamId}`;
  }

  private async getCache(teamId: string): Promise<CacheEntry | null> {
    if (!this.redis) return null;
    try {
      const raw = await this.redis.get(this.getCacheKey(teamId));
      if (!raw) return null;
      return JSON.parse(raw) as CacheEntry;
    } catch (err) {
      this.logger.warn(`Redis get failed: ${err}`);
      return null;
    }
  }

  private async setCache(teamId: string, recommendations: Recommendation[]): Promise<void> {
    if (!this.redis) return;
    try {
      const entry: CacheEntry = { recommendations, timestamp: Date.now() };
      await this.redis.setex(this.getCacheKey(teamId), this.CACHE_TTL, JSON.stringify(entry));
    } catch (err) {
      this.logger.warn(`Redis set failed: ${err}`);
    }
  }

  private isStale(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age > this.CACHE_TTL * 1000;
  }
}