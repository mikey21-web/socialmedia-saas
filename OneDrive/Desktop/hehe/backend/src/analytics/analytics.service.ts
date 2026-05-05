import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(input: {
    postId?: string;
    platform: string;
    externalId: string;
    metric: string;
    value: number;
  }) {
    let postId = input.postId;
    if (!postId) {
      const postPlatform = await this.prisma.postPlatform.findFirst({
        where: { platformPostId: input.externalId },
        select: { postId: true },
      });
      postId = postPlatform?.postId;
    }

    if (!postId) {
      return { recorded: false };
    }

    await this.prisma.analyticsEvent.create({
      data: {
        postId,
        eventType: `${input.platform}:${input.metric}`,
        count: Math.round(input.value),
      },
    });
    return { recorded: true };
  }

  async getMetrics(postId: string, teamId: string, startDate?: Date, endDate?: Date) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        teamId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!post) {
      return {
        postId,
        platforms: {},
        total: {
          impressions: 0,
          engagements: 0,
          likes: 0,
          comments: 0,
          engagement_rate: '0.0%',
        },
        collected_at: null,
      };
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        postId: post.id,
        collectedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { collectedAt: 'desc' },
    });

    const platforms: Record<string, Record<string, number>> = {};
    for (const event of events) {
      const [platform, metric] = event.eventType.split(':');
      if (!platform || !metric) {
        continue;
      }
      if (!platforms[platform]) {
        platforms[platform] = {};
      }
      platforms[platform][metric] = (platforms[platform][metric] ?? 0) + event.count;
    }

    const total = Object.values(platforms).reduce(
      (acc, metricMap) => ({
        impressions: acc.impressions + (metricMap.impressions ?? 0),
        engagements: acc.engagements + (metricMap.engagements ?? 0),
        likes: acc.likes + (metricMap.likes ?? 0),
        comments: acc.comments + (metricMap.comments ?? 0),
      }),
      { impressions: 0, engagements: 0, likes: 0, comments: 0 },
    );

    const engagementRate = total.impressions
      ? `${((total.engagements / total.impressions) * 100).toFixed(1)}%`
      : '0.0%';

    return {
      postId: post.id,
      platforms,
      total: {
        ...total,
        engagement_rate: engagementRate,
      },
      collected_at: events[0]?.collectedAt ?? null,
    };
  }

  async getTeamStats(teamId: string) {
    const posts = await this.prisma.post.findMany({
      where: { teamId, deletedAt: null },
      select: { id: true, content: true, createdAt: true },
    });
    const postIds = posts.map((post) => post.id);

    const events = postIds.length
      ? await this.prisma.analyticsEvent.findMany({
        where: { postId: { in: postIds } },
      })
      : [];

    const totals = {
      impressions: 0,
      engagements: 0,
      likes: 0,
      comments: 0,
      clicks: 0,
      followers_growth: 0,
    };
    const postMetrics = new Map<string, { impressions: number; engagements: number }>();
    const chartData = new Map<string, {
      date: string;
      impressions: number;
      engagements: number;
      likes: number;
      comments: number;
    }>();
    const platformStats = new Map<string, {
      platform: string;
      impressions: number;
      engagements: number;
      likes: number;
      comments: number;
    }>();

    for (const event of events) {
      const [platform, metric] = event.eventType.split(':');
      if (!platform || !metric) {
        continue;
      }

      const entry = postMetrics.get(event.postId) ?? { impressions: 0, engagements: 0 };
      const metricKey = metric as keyof typeof totals;
      if (metricKey in totals) {
        totals[metricKey] += event.count;
      }

      if (metric === 'impressions') {
        entry.impressions += event.count;
      }
      if (metric === 'engagements') {
        entry.engagements += event.count;
      }
      postMetrics.set(event.postId, entry);

      const date = event.collectedAt.toISOString().slice(0, 10);
      const day = chartData.get(date) ?? {
        date,
        impressions: 0,
        engagements: 0,
        likes: 0,
        comments: 0,
      };
      if (metric in day && metric !== 'date') {
        day[metric as 'impressions' | 'engagements' | 'likes' | 'comments'] += event.count;
      }
      chartData.set(date, day);

      const platformEntry = platformStats.get(platform) ?? {
        platform,
        impressions: 0,
        engagements: 0,
        likes: 0,
        comments: 0,
      };
      if (metric in platformEntry && metric !== 'platform') {
        platformEntry[metric as 'impressions' | 'engagements' | 'likes' | 'comments'] += event.count;
      }
      platformStats.set(platform, platformEntry);
    }

    const topPosts = posts
      .map((post) => ({
        postId: post.id,
        content: post.content,
        impressions: postMetrics.get(post.id)?.impressions ?? 0,
        engagements: postMetrics.get(post.id)?.engagements ?? 0,
      }))
      .sort((a, b) => b.engagements - a.engagements)
      .slice(0, 5);

    return {
      metrics: [
        { metric: 'impressions', value: totals.impressions },
        { metric: 'engagements', value: totals.engagements },
        { metric: 'likes', value: totals.likes },
        { metric: 'comments', value: totals.comments },
        { metric: 'clicks', value: totals.clicks },
        { metric: 'followers_growth', value: totals.followers_growth },
      ],
      chartData: Array.from(chartData.values()).sort((a, b) => a.date.localeCompare(b.date)),
      platformStats: Array.from(platformStats.values()).sort((a, b) =>
        a.platform.localeCompare(b.platform),
      ),
      topPosts,
    };
  }
}
