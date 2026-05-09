import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LlmService } from '../../../agents/llm/llm.service';
import { AnalyticsService } from '../../../analytics/analytics.service';
import { AgentRunLoggerService } from '../../agent-run-logger.service';
import { CompetitorReport, DailyInsight, WeeklyReport, WinningPatterns } from '../../types';

@Injectable()
export class AnalystService {
  private readonly logger = new Logger(AnalystService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly analyticsService: AnalyticsService,
    private readonly runLogger: AgentRunLoggerService,
  ) {}

  async generateWeeklyReport(teamId: string): Promise<WeeklyReport> {
    const start = Date.now();

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const summary = await this.analyticsService.getSummary({
      teamId,
      from: weekAgo.toISOString(),
      to: now.toISOString(),
    });

    const posts = await this.prisma.post.findMany({
      where: {
        teamId,
        status: 'published',
        createdAt: { gte: weekAgo },
        deletedAt: null,
      },
      orderBy: { impressions: 'desc' },
      take: 20,
      select: { id: true, title: true, content: true, impressions: true, reach: true },
    });

    const topPosts = posts.slice(0, 5).map(p => ({
      postId: p.id,
      title: p.title ?? p.content.slice(0, 60),
      impressions: p.impressions,
      engagements: 0,
    }));

    const underperformers = posts.slice(-5).map(p => ({
      postId: p.id,
      title: p.title ?? p.content.slice(0, 60),
      impressions: p.impressions,
    }));

    const prompt = `Analyze this week's social media performance and provide actionable insights.

Total impressions: ${summary.totalImpressions}
Total engagements: ${summary.totalEngagements}
Total reach: ${summary.totalReach}
Posts published: ${posts.length}

Top posts: ${topPosts.map(p => `"${p.title}" (${p.impressions} impressions)`).join(', ')}
Underperformers: ${underperformers.map(p => `"${p.title}" (${p.impressions} impressions)`).join(', ')}

Return JSON:
{
  "summary": "one paragraph executive summary",
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["recommendation1", "recommendation2"],
  "followerGrowth": { "instagram": 50, "x": 30 },
  "engagementRate": { "instagram": 4.5, "x": 2.1 }
}`;

    const result = await this.llm.completeJson<{
      summary: string;
      insights: string[];
      recommendations: string[];
      followerGrowth: Record<string, number>;
      engagementRate: Record<string, number>;
    }>(prompt, { maxTokens: 1500 });

    await this.prisma.report.create({
      data: {
        teamId,
        type: 'weekly',
        periodStart: weekAgo,
        periodEnd: now,
        data: {
          summary: result.summary,
          topPosts,
          underperformers,
          followerGrowth: result.followerGrowth ?? {},
          engagementRate: result.engagementRate ?? {},
        },
        insights: result.insights ?? [],
        recommendations: result.recommendations ?? [],
      },
    });

    await this.runLogger.log({
      teamId,
      agentRole: 'analyst',
      triggerType: 'scheduled',
      input: { type: 'weekly_report' },
      output: result as unknown as Record<string, unknown>,
      tokensUsed: 1800,
      durationMs: Date.now() - start,
      status: 'success',
    });

    return {
      summary: result.summary,
      topPosts,
      underperformers,
      insights: result.insights ?? [],
      recommendations: result.recommendations ?? [],
      followerGrowth: result.followerGrowth ?? {},
      engagementRate: result.engagementRate ?? {},
    };
  }

  async generateDailyInsight(teamId: string): Promise<DailyInsight> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const posts = await this.prisma.post.findMany({
      where: {
        teamId,
        status: 'published',
        createdAt: { gte: yesterday },
        deletedAt: null,
      },
      orderBy: { impressions: 'desc' },
      take: 10,
      select: { id: true, title: true, content: true, impressions: true },
    });

    const topPosts = posts.slice(0, 3).map(p => ({
      postId: p.id,
      title: p.title ?? p.content.slice(0, 60),
      impressions: p.impressions,
    }));

    const underperformers = posts.filter(p => p.impressions < 50).map(p => ({
      postId: p.id,
      title: p.title ?? p.content.slice(0, 60),
      impressions: p.impressions,
    }));

    const avgImpressions = posts.length
      ? Math.round(posts.reduce((s, p) => s + p.impressions, 0) / posts.length)
      : 0;

    const needsAdjustment = avgImpressions < 100 || underperformers.length > posts.length / 2;

    const insight = {
      date: yesterday.toISOString().slice(0, 10),
      topPosts,
      underperformers,
      insights: [`Average impressions yesterday: ${avgImpressions}`, `${posts.length} posts published`],
      recommendations: needsAdjustment
        ? ['Consider adjusting content strategy', 'Try different posting times']
        : ['Strategy performing well', 'Maintain current approach'],
      needsAdjustment,
    };

    await this.prisma.report.create({
      data: {
        teamId,
        type: 'daily',
        periodStart: yesterday,
        periodEnd: now,
        data: insight,
        insights: insight.insights,
        recommendations: insight.recommendations,
      },
    });

    return insight;
  }

  async listReports(teamId: string, type?: string) {
    return this.prisma.report.findMany({
      where: { teamId, ...(type ? { type } : {}) },
      orderBy: { generatedAt: 'desc' },
      take: 50,
    });
  }

  async findWinningPatterns(teamId: string): Promise<WinningPatterns> {
    const posts = await this.prisma.post.findMany({
      where: { teamId, status: 'published', deletedAt: null },
      orderBy: { impressions: 'desc' },
      take: 50,
      select: { title: true, content: true, impressions: true },
    });

    const prompt = `Analyze these top performing posts and identify winning patterns.

Posts:
${posts.slice(0, 20).map(p => `- "${p.title || p.content.slice(0, 80)}" (${p.impressions} impressions)`).join('\n')}

Return JSON:
{
  "topics": ["topic1", "topic2"],
  "formats": ["short-form tips", "carousels"],
  "timings": [{ "platform": "instagram", "bestTime": "9:00 AM" }],
  "hashtags": ["#tag1", "#tag2"]
}`;

    return this.llm.completeJson<WinningPatterns>(prompt);
  }

  async analyzeCompetitors(input: {
    teamId: string;
    competitorHandles: { platform: string; handle: string }[];
  }): Promise<CompetitorReport> {
    const prompt = `Analyze these competitor social media accounts and provide strategic insights.

Competitors:
${input.competitorHandles.map(c => `- @${c.handle} on ${c.platform}`).join('\n')}

Return JSON:
{
  "competitors": [{ "handle": "...", "platform": "...", "postingFrequency": "daily", "topTopics": ["topic1"], "engagementRate": "3.5%", "strengths": ["..."], "weaknesses": ["..."] }],
  "opportunities": ["opportunity1"],
  "threats": ["threat1"]
}`;

    return this.llm.completeJson<CompetitorReport>(prompt, { maxTokens: 2048 });
  }
}
