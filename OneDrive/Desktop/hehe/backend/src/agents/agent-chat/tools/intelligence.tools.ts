import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { PrismaService } from '../../../prisma/prisma.service';
import { TrendService } from '../../trend/trend.service';
import { CompetitorService } from '../../competitor/competitor.service';
import { BrandService } from '../../../brand/brand.service';
import { LlmService } from '../../llm/llm.service';
import { ContentService } from '../../content/content.service';
import { PendingApproval } from '../state';

export function buildIntelligenceTools(
  prisma: PrismaService,
  trendService: TrendService,
  competitorService: CompetitorService,
  brandService: BrandService,
  llm: LlmService,
  contentService: ContentService,
  teamId: string,
): DynamicStructuredTool[] {
  const getTrends = new DynamicStructuredTool({
    name: 'getTrends',
    description: 'Get current trending topics relevant to the brand',
    schema: z.object({
      platform: z.string().optional(),
      limit: z.number().min(1).max(30).optional().default(10),
    }),
    func: async ({ platform, limit }) => {
      const trends = await prisma.trendItem.findMany({
        where: {
          teamId,
          status: 'active',
          ...(platform ? { platform } : {}),
        },
        orderBy: { relevanceScore: 'desc' },
        take: limit ?? 10,
      });

      return JSON.stringify({
        trends: trends.map(t => ({
          keyword: t.keyword,
          platform: t.platform,
          volume: t.volume,
          relevanceScore: t.relevanceScore,
          summary: t.summary,
          brandFitReason: t.brandFitReason,
        })),
      });
    },
  });

  const getCompetitorActivity = new DynamicStructuredTool({
    name: 'getCompetitorActivity',
    description: 'Analyze recent competitor activity and identify opportunities',
    schema: z.object({
      competitorId: z.string().optional(),
      lookbackDays: z.number().min(1).max(30).optional().default(7),
    }),
    func: async ({ competitorId, lookbackDays }) => {
      const since = new Date();
      since.setDate(since.getDate() - (lookbackDays ?? 7));

      const profileIds = await getProfileIds(prisma, teamId);

      const snapshots = await prisma.competitorSnapshot.findMany({
        where: {
          competitor: {
            brandProfileId: { in: profileIds },
            isActive: true,
            ...(competitorId ? { id: competitorId } : {}),
          },
          capturedAt: { gte: since },
        },
        include: { competitor: { select: { name: true, id: true } } },
        orderBy: { capturedAt: 'desc' },
        take: 20,
      });

      const byCompetitor = new Map<string, { name: string; posts: unknown[] }>();
      for (const snap of snapshots) {
        const entry = byCompetitor.get(snap.competitorId) ?? {
          name: snap.competitor.name,
          posts: [],
        };
        const topPosts = Array.isArray(snap.topPosts) ? snap.topPosts : [];
        entry.posts.push(...topPosts.slice(0, 3));
        byCompetitor.set(snap.competitorId, entry);
      }

      const competitors = Array.from(byCompetitor.values());

      let overallInsights = 'No recent competitor data available.';
      if (competitors.length > 0) {
        overallInsights = await llm.complete(
          `Analyze these competitor activities and provide 3 insights about what topics dominate, any viral content, and opportunities:\n${JSON.stringify(competitors.slice(0, 5))}`,
        );
      }

      return JSON.stringify({
        competitors: competitors.map(c => ({
          name: c.name,
          recentPostsCount: c.posts.length,
          topPosts: c.posts.slice(0, 3),
        })),
        overallInsights,
      });
    },
  });

  const suggestCompetitorResponse = new DynamicStructuredTool({
    name: 'suggestCompetitorResponse',
    description: 'Suggest ways to respond to a competitor\'s viral content',
    schema: z.object({
      competitorName: z.string(),
      viralPostContent: z.string(),
      yourPlatform: z.string(),
    }),
    func: async ({ competitorName, viralPostContent, yourPlatform }) => {
      let brandName = 'Your brand';
      try {
        const brand = await brandService.getBrandContext(teamId);
        brandName = brand.brandName;
      } catch {
        // use default
      }

      const suggestionsRaw = await llm.complete(
        `A competitor (${competitorName}) posted this viral content: "${viralPostContent}".\n\nAs ${brandName} on ${yourPlatform}, suggest exactly 3 specific, actionable ways to respond or capitalize on this trend. Be concrete and creative, not generic.\n\nRespond with a JSON array of 3 strings.`,
      );

      let suggestions: string[] = [];
      try {
        suggestions = JSON.parse(suggestionsRaw) as string[];
      } catch {
        suggestions = [suggestionsRaw];
      }

      const drafts: Array<{ postId: string; preview: string }> = [];
      const pendingApprovals: PendingApproval[] = [];

      for (const suggestion of suggestions.slice(0, 3)) {
        try {
          const result = await contentService.generate(teamId, {
            topic: suggestion,
            platforms: [yourPlatform],
            intent: 'awareness',
          });
          for (const postId of result.postIds) {
            const post = await prisma.post.findUnique({ where: { id: postId } });
            const preview = post?.content?.slice(0, 150) ?? '';
            drafts.push({ postId, preview });
            pendingApprovals.push({
              type: 'post_draft',
              data: { postId, preview, platform: yourPlatform },
              approvalId: crypto.randomUUID(),
            });
          }
        } catch {
          // skip failed draft
        }
      }

      return JSON.stringify({ suggestions, drafts, pendingApprovals });
    },
  });

  const identifyTrendingTopics = new DynamicStructuredTool({
    name: 'identifyTrendingTopics',
    description: 'Aggregate and rank trending topics from stored trend data, grouped by platform and relevance',
    schema: z.object({
      platform: z.string().optional(),
      minRelevance: z.number().min(0).max(1).optional().describe('Minimum relevance score (0-1)'),
    }),
    func: async ({ platform, minRelevance }) => {
      const trends = await prisma.trendItem.findMany({
        where: {
          teamId,
          status: 'active',
          ...(platform ? { platform } : {}),
          ...(minRelevance != null ? { relevanceScore: { gte: minRelevance } } : {}),
        },
        orderBy: [{ relevanceScore: 'desc' }, { volume: 'desc' }],
        take: 20,
      });

      const byPlatform = new Map<string, typeof trends>();
      for (const t of trends) {
        const list = byPlatform.get(t.platform) ?? [];
        list.push(t);
        byPlatform.set(t.platform, list);
      }

      const grouped = Object.fromEntries(
        [...byPlatform.entries()].map(([plat, items]) => [
          plat,
          items.map(t => ({
            keyword: t.keyword,
            volume: t.volume,
            relevanceScore: t.relevanceScore,
            summary: t.summary,
            brandFitReason: t.brandFitReason,
          })),
        ]),
      );

      return JSON.stringify({ success: true, total: trends.length, byPlatform: grouped });
    },
  });

  const monitorInfluencers = new DynamicStructuredTool({
    name: 'monitorInfluencers',
    description: 'Identify and analyze influencers in your niche based on competitor data and trends',
    schema: z.object({
      niche: z.string().describe('Industry or niche to search within'),
      platform: z.enum(['x', 'instagram', 'linkedin', 'tiktok']),
    }),
    func: async ({ niche, platform }) => {
      let brandName = 'Your brand';
      try {
        const brand = await brandService.getBrandContext(teamId);
        brandName = brand.brandName;
      } catch {
        // use default
      }

      const recentTrends = await prisma.trendItem.findMany({
        where: { teamId, platform, status: 'active' },
        orderBy: { relevanceScore: 'desc' },
        take: 5,
        select: { keyword: true },
      });

      const trendKeywords = recentTrends.map(t => t.keyword).join(', ');

      const response = await llm.complete(
        `As a social media strategist for ${brandName}, suggest 5 influencer profiles to monitor or collaborate with in the "${niche}" niche on ${platform}. Consider these trending topics: ${trendKeywords || 'general industry trends'}.\n\nReturn a JSON object: { "influencers": [{ "suggestedHandle": "...", "reason": "...", "followerEstimate": "...", "collaborationType": "..." }] }`,
      );

      try {
        const parsed = JSON.parse(response) as { influencers: Array<{ suggestedHandle: string; reason: string; followerEstimate: string; collaborationType: string }> };
        return JSON.stringify({ success: true, platform, niche, influencers: parsed.influencers });
      } catch {
        return JSON.stringify({ success: true, platform, niche, rawSuggestion: response });
      }
    },
  });

  void trendService; // available for future direct calls
  return [getTrends, getCompetitorActivity, suggestCompetitorResponse, identifyTrendingTopics, monitorInfluencers];
}

async function getProfileIds(prisma: PrismaService, teamId: string): Promise<string[]> {
  const profile = await prisma.brandProfile.findUnique({
    where: { teamId },
    select: { id: true },
  });
  return profile ? [profile.id] : [];
}
