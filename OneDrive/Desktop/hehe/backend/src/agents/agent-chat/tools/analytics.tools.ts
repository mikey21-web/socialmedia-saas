import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalyticsService } from '../../../analytics/analytics.service';
import { LlmService } from '../../llm/llm.service';

export function buildAnalyticsTools(
  prisma: PrismaService,
  analyticsService: AnalyticsService,
  llm: LlmService,
  teamId: string,
): DynamicStructuredTool[] {
  const getAnalytics = new DynamicStructuredTool({
    name: 'getAnalytics',
    description: 'Get performance analytics for the team across all platforms',
    schema: z.object({
      from: z.string().optional().describe('ISO date string start'),
      to: z.string().optional().describe('ISO date string end'),
      platform: z.string().optional(),
    }),
    func: async ({ from, to, platform }) => {
      const summary = await analyticsService.getSummary({ teamId, from, to });
      if (platform) {
        const filtered = {
          ...summary,
          byPlatform: summary.byPlatform.filter(
            (p: { platform: string }) => p.platform === platform,
          ),
        };
        return JSON.stringify(filtered);
      }
      return JSON.stringify(summary);
    },
  });

  const diagnosePerformance = new DynamicStructuredTool({
    name: 'diagnosePerformance',
    description:
      'Analyze recent performance and generate a plain-English diagnosis of what is working and what is not',
    schema: z.object({
      lookbackDays: z.number().min(7).max(90).default(30),
    }),
    func: async ({ lookbackDays }) => {
      const since = new Date();
      since.setDate(since.getDate() - lookbackDays);
      const summary = await analyticsService.getSummary({
        teamId,
        from: since.toISOString(),
      });

      const bestTimes = await analyticsService.getBestPostingTimes(teamId);

      const dataContext = `
Analytics Summary (last ${lookbackDays} days):
- Total impressions: ${summary.totalImpressions}
- Total engagements: ${summary.totalEngagements}
- Top posts: ${JSON.stringify(summary.topPosts.slice(0, 3))}
- By platform: ${JSON.stringify(summary.byPlatform)}
- Best posting times: ${JSON.stringify(bestTimes)}
      `.trim();

      const diagnosis = await llm.complete(
        `You are a social media analyst. Based on this data, provide a concise performance diagnosis in 3-5 sentences. Be specific, mention actual numbers, and give 3 actionable recommendations.\n\n${dataContext}`,
      );

      const recommendations = await llm.complete(
        `Based on this social media data, list exactly 3 specific recommendations as a JSON array of strings.\n\n${dataContext}\n\nRespond with only a JSON array like: ["rec1", "rec2", "rec3"]`,
      );

      let recArray: string[] = [];
      try {
        recArray = JSON.parse(recommendations) as string[];
      } catch {
        recArray = [recommendations];
      }

      return JSON.stringify({
        totalImpressions: summary.totalImpressions,
        totalEngagements: summary.totalEngagements,
        byPlatform: summary.byPlatform,
        bestTimes,
        diagnosis,
        recommendations: recArray,
      });
    },
  });

  const generateExecutiveReport = new DynamicStructuredTool({
    name: 'generateExecutiveReport',
    description:
      'Generate a formatted executive report covering growth, performance, and next steps',
    schema: z.object({
      fromDate: z.string(),
      toDate: z.string(),
    }),
    func: async ({ fromDate, toDate }) => {
      const summary = await analyticsService.getSummary({ teamId, from: fromDate, to: toDate });
      const followerGrowth = await analyticsService.getFollowerGrowth(
        teamId,
        new Date(fromDate),
        new Date(toDate),
      );

      const dataContext = `
Period: ${fromDate} to ${toDate}
Impressions: ${summary.totalImpressions}
Engagements: ${summary.totalEngagements}
Top Posts: ${JSON.stringify(summary.topPosts.slice(0, 5))}
Follower Growth: ${JSON.stringify(followerGrowth.growthByPlatform)}
By Platform: ${JSON.stringify(summary.byPlatform)}
      `.trim();

      const report = await llm.complete(
        `Write a professional 3-section executive report in markdown format:\n1. Executive Summary\n2. What Worked\n3. What To Do Next\n\nBe data-driven and specific.\n\n${dataContext}`,
        { maxTokens: 1500 },
      );

      const highlights = await llm.complete(
        `Based on this data, give 3 key highlights as a JSON array of short strings (under 80 chars each).\n\n${dataContext}\n\nRespond only with a JSON array.`,
      );

      let highlightArray: string[] = [];
      try {
        highlightArray = JSON.parse(highlights) as string[];
      } catch {
        highlightArray = [];
      }

      return JSON.stringify({
        report,
        periodFrom: fromDate,
        periodTo: toDate,
        highlights: highlightArray,
      });
    },
  });

  const identifyTopPerformers = new DynamicStructuredTool({
    name: 'identifyTopPerformers',
    description: 'Identify best-performing posts and content patterns within a time range',
    schema: z.object({
      timeframeDays: z.number().min(1).max(180).describe('Look back N days'),
      limit: z.number().min(1).max(20).optional().describe('Number of top posts to return (default 10)'),
      platform: z.string().optional(),
    }),
    func: async ({ timeframeDays, limit, platform }) => {
      const since = new Date();
      since.setDate(since.getDate() - timeframeDays);

      const topPosts = await prisma.post.findMany({
        where: {
          teamId,
          status: 'published',
          createdAt: { gte: since },
          deletedAt: null,
          ...(platform
            ? { platforms: { some: { platform } } }
            : {}),
        },
        include: {
          platforms: { select: { platform: true, platformPostId: true } },
        },
        orderBy: { impressions: 'desc' },
        take: limit ?? 10,
      });

      return JSON.stringify({
        success: true,
        timeframeDays,
        topPosts: topPosts.map(p => ({
          postId: p.id,
          title: p.title,
          contentPreview: p.content.slice(0, 120),
          impressions: p.impressions,
          reach: p.reach,
          platforms: p.platforms.map(pp => pp.platform),
          createdAt: p.createdAt.toISOString(),
        })),
      });
    },
  });

  const comparePeriods = new DynamicStructuredTool({
    name: 'comparePeriods',
    description: 'Compare performance metrics between two time periods',
    schema: z.object({
      period1Start: z.string().describe('ISO date'),
      period1End: z.string().describe('ISO date'),
      period2Start: z.string().describe('ISO date'),
      period2End: z.string().describe('ISO date'),
    }),
    func: async ({ period1Start, period1End, period2Start, period2End }) => {
      const p1 = await analyticsService.getSummary({
        teamId,
        from: period1Start,
        to: period1End,
      });
      const p2 = await analyticsService.getSummary({
        teamId,
        from: period2Start,
        to: period2End,
      });

      const safeDivide = (a: number, b: number) =>
        b === 0 ? 0 : Math.round(((a - b) / b) * 1000) / 10;

      return JSON.stringify({
        success: true,
        period1: { from: period1Start, to: period1End, ...p1 },
        period2: { from: period2Start, to: period2End, ...p2 },
        changes: {
          impressionChangePct: safeDivide(p2.totalImpressions, p1.totalImpressions),
          engagementChangePct: safeDivide(p2.totalEngagements, p1.totalEngagements),
        },
      });
    },
  });

  return [getAnalytics, diagnosePerformance, generateExecutiveReport, identifyTopPerformers, comparePeriods];
}
