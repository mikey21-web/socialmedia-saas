import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(input: {
    teamId: string;
    requestedTeamId?: string;
    from?: string;
    to?: string;
  }) {
    if (input.requestedTeamId && input.requestedTeamId !== input.teamId) {
      throw new ForbiddenException('You do not have access to this team');
    }

    const range = this.resolveDateRange(input.from, input.to);
    const posts = await this.prisma.post.findMany({
      where: {
        teamId: input.teamId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        platforms: {
          select: {
            platform: true,
          },
        },
        analytics: {
          where: {
            collectedAt: {
              gte: range.from,
              lte: range.to,
            },
          },
          select: {
            count: true,
            eventType: true,
            collectedAt: true,
          },
        },
      },
    });

    const byPlatformMap = new Map<string, {
      platform: string;
      impressions: number;
      likes: number;
      comments: number;
      shares: number;
      reach: number;
      engagements: number;
    }>();
    const byDayMap = new Map<string, { date: string; impressions: number; engagements: number }>();
    const byDayPlatformMap = new Map<string, Record<string, number | string>>();
    const topPostsMap = new Map<string, {
      postId: string;
      title: string;
      platform: string;
      impressions: number;
      engagements: number;
    }>();

    for (const post of posts) {
      const fallbackPlatform = post.platforms[0]?.platform ?? 'unknown';
      const topEntry = topPostsMap.get(post.id) ?? {
        postId: post.id,
        title: post.title,
        platform: fallbackPlatform,
        impressions: 0,
        engagements: 0,
      };

      for (const event of post.analytics) {
        const { platform, metric } = this.parseEventType(event.eventType, fallbackPlatform);
        const normalizedMetric = this.normalizeMetric(metric);
        if (!normalizedMetric) {
          continue;
        }

        const platformEntry = byPlatformMap.get(platform) ?? {
          platform,
          impressions: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0,
          engagements: 0,
        };

        if (normalizedMetric === 'impressions') {
          platformEntry.impressions += event.count;
          topEntry.impressions += event.count;
        } else if (normalizedMetric === 'reach') {
          platformEntry.reach += event.count;
        } else if (normalizedMetric === 'likes') {
          platformEntry.likes += event.count;
          platformEntry.engagements += event.count;
          topEntry.engagements += event.count;
        } else if (normalizedMetric === 'comments') {
          platformEntry.comments += event.count;
          platformEntry.engagements += event.count;
          topEntry.engagements += event.count;
        } else if (normalizedMetric === 'shares') {
          platformEntry.shares += event.count;
          platformEntry.engagements += event.count;
          topEntry.engagements += event.count;
        } else if (normalizedMetric === 'engagements') {
          platformEntry.engagements += event.count;
          topEntry.engagements += event.count;
        }

        byPlatformMap.set(platform, platformEntry);

        const date = event.collectedAt.toISOString().slice(0, 10);
        const dayEntry = byDayMap.get(date) ?? { date, impressions: 0, engagements: 0 };
        if (normalizedMetric === 'impressions') {
          dayEntry.impressions += event.count;
        }
        if (normalizedMetric === 'engagements' || normalizedMetric === 'likes' || normalizedMetric === 'comments' || normalizedMetric === 'shares') {
          dayEntry.engagements += event.count;
        }
        byDayMap.set(date, dayEntry);

        const dailyPlatformEntry = byDayPlatformMap.get(date) ?? { date };
        if (normalizedMetric === 'impressions') {
          const currentValue = typeof dailyPlatformEntry[platform] === 'number'
            ? (dailyPlatformEntry[platform] as number)
            : 0;
          dailyPlatformEntry[platform] = currentValue + event.count;
        }
        byDayPlatformMap.set(date, dailyPlatformEntry);
      }

      topPostsMap.set(post.id, topEntry);
    }

    const byPlatform = Array.from(byPlatformMap.values()).sort((a, b) => a.platform.localeCompare(b.platform));
    const totalImpressions = byPlatform.reduce((sum, item) => sum + item.impressions, 0);
    const totalReach = byPlatform.reduce((sum, item) => sum + item.reach, 0);
    const totalEngagements = byPlatform.reduce((sum, item) => sum + item.engagements, 0);

    return {
      totalImpressions,
      totalEngagements,
      totalReach,
      byPlatform: byPlatform.map(({ reach: _reach, engagements: _engagements, ...item }) => item),
      byDay: Array.from(byDayMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      byDayPlatform: Array.from(byDayPlatformMap.values()).sort((a, b) =>
        String(a.date).localeCompare(String(b.date)),
      ),
      topPosts: Array.from(topPostsMap.values())
        .sort((a, b) => {
          if (b.engagements !== a.engagements) {
            return b.engagements - a.engagements;
          }
          return b.impressions - a.impressions;
        })
        .slice(0, 10),
    };
  }

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

  async getSmartSuggestions(teamId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const posts = await this.prisma.post.findMany({
      where: {
        teamId,
        deletedAt: null,
        scheduledAt: { gte: since },
      },
      include: {
        platforms: { select: { platform: true } },
        analytics: { select: { count: true, eventType: true } },
      },
    });

    const hourScores = new Map<number, number>();
    const platformScores = new Map<string, number>();
    const dayScores = new Map<number, { score: number; count: number }>();

    for (const post of posts) {
      const engagementScore = post.analytics.reduce((acc, event) => {
        if (event.eventType.includes('engagement') || event.eventType.includes('like') || event.eventType.includes('comment')) {
          return acc + event.count;
        }
        return acc;
      }, 0);

      if (post.scheduledAt) {
        const hour = post.scheduledAt.getHours();
        hourScores.set(hour, (hourScores.get(hour) ?? 0) + Math.max(engagementScore, 1));

        const dow = post.scheduledAt.getDay();
        const current = dayScores.get(dow) ?? { score: 0, count: 0 };
        dayScores.set(dow, { score: current.score + engagementScore, count: current.count + 1 });
      }

      for (const platform of post.platforms) {
        platformScores.set(platform.platform, (platformScores.get(platform.platform) ?? 0) + Math.max(engagementScore, 1));
      }
    }

    const bestTimes = Array.from(hourScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${String(hour).padStart(2, '0')}:00`);

    const topPlatforms = Array.from(platformScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([platform]) => platform);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestDayEntry = Array.from(dayScores.entries())
      .map(([day, stats]) => ({ day, avg: stats.count ? stats.score / stats.count : 0 }))
      .sort((a, b) => b.avg - a.avg)[0];

    const weeklyInsight = bestDayEntry
      ? `Your strongest day is ${dayNames[bestDayEntry.day]} based on average engagement over the last 30 days.`
      : 'Not enough data yet. Publish consistently this week to unlock stronger insights.';

    const contentTips: string[] = [];
    if (bestTimes.length) {
      contentTips.push(`Schedule around ${bestTimes[0]} to match your top-performing time window.`);
    }
    if (topPlatforms.length) {
      contentTips.push(`Prioritize ${topPlatforms[0]} for high-impact posts this week.`);
    }
    contentTips.push('Use concise hooks in the first line and include one clear call-to-action.');

    return {
      bestTimes: bestTimes.length ? bestTimes : ['09:00', '13:00', '18:00'],
      topPlatforms: topPlatforms.length ? topPlatforms : ['linkedin', 'twitter'],
      contentTips,
      weeklyInsight,
    };
  }

  private resolveDateRange(from?: string, to?: string) {
    const end = to ? new Date(to) : new Date();
    const start = from ? new Date(from) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    return { from: start, to: end };
  }

  private parseEventType(eventType: string, fallbackPlatform: string) {
    const [first, second] = eventType.split(':');
    if (!second) {
      return {
        platform: fallbackPlatform,
        metric: first,
      };
    }
    return {
      platform: first,
      metric: second,
    };
  }

  private normalizeMetric(metric: string) {
    const normalized = metric.toLowerCase();
    if (normalized === 'impression' || normalized === 'impressions' || normalized === 'view' || normalized === 'views') {
      return 'impressions';
    }
    if (normalized === 'reach') {
      return 'reach';
    }
    if (normalized === 'like' || normalized === 'likes') {
      return 'likes';
    }
    if (normalized === 'comment' || normalized === 'comments' || normalized === 'reply' || normalized === 'replies') {
      return 'comments';
    }
    if (normalized === 'share' || normalized === 'shares' || normalized === 'retweet' || normalized === 'retweets') {
      return 'shares';
    }
    if (normalized === 'engagement' || normalized === 'engagements') {
      return 'engagements';
    }
    return null;
  }
}
