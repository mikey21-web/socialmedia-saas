import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PLATFORM_BENCHMARKS } from './benchmarks';

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
      saves: number;
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
          saves: 0,
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
        } else if (normalizedMetric === 'saves') {
          platformEntry.saves += event.count;
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
        if (normalizedMetric === 'engagements' || normalizedMetric === 'likes' || normalizedMetric === 'comments' || normalizedMetric === 'shares' || normalizedMetric === 'saves') {
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
    const totalSaves = byPlatform.reduce((sum, item) => sum + item.saves, 0);

    return {
      totalImpressions,
      totalEngagements,
      totalReach,
      totalSaves,
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
        reach: acc.reach + (metricMap.reach ?? 0),
      }),
      { impressions: 0, engagements: 0, likes: 0, comments: 0, reach: 0 },
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

  async getLastMetricsUpdate(teamId: string) {
    const post = await this.prisma.post.findFirst({
      where: { teamId, deletedAt: null, status: 'published' },
      orderBy: { metricsUpdatedAt: 'desc' },
      select: { metricsUpdatedAt: true },
    });
    return { lastUpdated: post?.metricsUpdatedAt ?? null };
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

  resolveDateRangePublic(from?: string, to?: string) {
    return this.resolveDateRange(from, to);
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
    if (normalized === 'save' || normalized === 'saves') {
      return 'saves';
    }
    if (normalized === 'engagement' || normalized === 'engagements') {
      return 'engagements';
    }
    if (normalized === 'watch_time' || normalized === 'average_view_duration') {
      return 'watch_time';
    }
    if (normalized === 'completion_rate') {
      return 'completion_rate';
    }
    if (normalized === 'play_count' || normalized === 'video_views') {
      return 'video_views';
    }
    return null;
  }

  async getPlatformROI(teamId: string, startDate?: Date, endDate?: Date) {
    const range = this.resolveDateRange(startDate?.toISOString(), endDate?.toISOString());

    const posts = await this.prisma.post.findMany({
      where: {
        teamId,
        deletedAt: null,
        status: 'published',
      },
      include: {
        platforms: { select: { platform: true } },
        analytics: {
          where: {
            collectedAt: { gte: range.from, lte: range.to },
          },
          select: { eventType: true, count: true },
        },
      },
    });

    const platformROI = new Map<string, { impressions: number; engagements: number; reach: number; likes: number; comments: number; shares: number; posts: number }>();

    for (const post of posts) {
      const platform = post.platforms[0]?.platform ?? 'unknown';
      const entry = platformROI.get(platform) ?? { impressions: 0, engagements: 0, reach: 0, likes: 0, comments: 0, shares: 0, posts: 0 };

      for (const event of post.analytics) {
        const metric = this.normalizeMetric(event.eventType.split(':')[1] || event.eventType);
        if (metric === 'impressions') entry.impressions += event.count;
        if (metric === 'engagements') entry.engagements += event.count;
        if (metric === 'reach') entry.reach += event.count;
        if (metric === 'likes') entry.likes += event.count;
        if (metric === 'comments') entry.comments += event.count;
        if (metric === 'shares') entry.shares += event.count;
      }

      entry.posts += 1;
      platformROI.set(platform, entry);
    }

    return Array.from(platformROI.entries()).map(([platform, data]) => ({
      platform,
      ...data,
      engagementRate: data.impressions > 0 ? (data.engagements / data.impressions) * 100 : 0,
    }));
  }

  async getBestPostingTimes(teamId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const posts = await this.prisma.post.findMany({
      where: {
        teamId,
        deletedAt: null,
        status: 'published',
        scheduledAt: { gte: since },
      },
      include: {
        platforms: { select: { platform: true } },
        analytics: { select: { eventType: true, count: true } },
      },
    });

    type TimeSlot = { hour: number; dow: number; engagement: number; posts: number; platform: string };
    const timeSlots = new Map<string, TimeSlot>();

    for (const post of posts) {
      if (!post.scheduledAt) continue;
      const scheduledAt = new Date(post.scheduledAt);
      const hour = scheduledAt.getHours();
      const dow = scheduledAt.getDay();
      const platform = post.platforms[0]?.platform ?? 'unknown';

      let totalEngagement = 0;
      for (const event of post.analytics) {
        const metric = this.normalizeMetric(event.eventType.split(':')[1] || event.eventType);
        if (metric === 'engagements' || metric === 'likes' || metric === 'comments' || metric === 'shares') {
          totalEngagement += event.count;
        }
      }

      const key = `${platform}-${hour}-${dow}`;
      const existing = timeSlots.get(key) ?? { hour, dow, engagement: 0, posts: 0, platform };
      existing.engagement += totalEngagement;
      existing.posts += 1;
      timeSlots.set(key, existing);
    }

    const bestTimes: Record<string, Array<{ day: string; hour: number; avgEngagement: number }>> = {};
    const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const [key, slot] of timeSlots.entries()) {
      const platform = slot.platform;
      if (!bestTimes[platform]) bestTimes[platform] = [];
      bestTimes[platform].push({
        day: DOW_NAMES[slot.dow],
        hour: slot.hour,
        avgEngagement: slot.posts > 0 ? slot.engagement / slot.posts : 0,
      });
    }

    for (const platform of Object.keys(bestTimes)) {
      bestTimes[platform] = bestTimes[platform]
        .sort((a, b) => b.avgEngagement - a.avgEngagement)
        .slice(0, 3);
    }

    return bestTimes;
  }

  async getFollowerGrowth(teamId: string, from?: Date, to?: Date) {
    const range = this.resolveDateRange(from?.toISOString(), to?.toISOString());
    const snapshots = await this.prisma.followerSnapshot.findMany({
      where: {
        teamId,
        recordedAt: { gte: range.from, lte: range.to },
      },
      orderBy: { recordedAt: 'asc' },
    });

    const byDate = new Map<string, Record<string, number | string>>();
    const earliestByPlatform = new Map<string, number>();
    const latestByPlatform: Record<string, number> = {};

    for (const snapshot of snapshots) {
      const date = snapshot.recordedAt.toISOString().slice(0, 10);
      const entry = byDate.get(date) ?? { date };
      entry[snapshot.platform] = snapshot.count;
      byDate.set(date, entry);

      if (!earliestByPlatform.has(snapshot.platform)) {
        earliestByPlatform.set(snapshot.platform, snapshot.count);
      }
      latestByPlatform[snapshot.platform] = snapshot.count;
    }

    const growthByPlatform: Record<string, number> = {};
    for (const [platform, latest] of Object.entries(latestByPlatform)) {
      growthByPlatform[platform] = latest - (earliestByPlatform.get(platform) ?? latest);
    }

    return {
      series: Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date))),
      latestByPlatform,
      growthByPlatform,
    };
  }

  async recordFollowerSnapshot(teamId: string, platform: string, count: number) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const existing = await this.prisma.followerSnapshot.findFirst({
      where: {
        teamId,
        platform,
        recordedAt: { gte: startOfToday },
      },
      orderBy: { recordedAt: 'desc' },
      select: { id: true },
    });

    if (existing) {
      return this.prisma.followerSnapshot.update({
        where: { id: existing.id },
        data: { count },
      });
    }

    return this.prisma.followerSnapshot.create({
      data: { teamId, platform, count },
    });
  }

  async getVideoMetrics(teamId: string, from?: Date, to?: Date) {
    const range = this.resolveDateRange(from?.toISOString(), to?.toISOString());
    const videoPlatforms = ['tiktok', 'youtube', 'instagram'];
    const posts = await this.prisma.post.findMany({
      where: {
        teamId,
        deletedAt: null,
        status: 'published',
        platforms: { some: { platform: { in: videoPlatforms } } },
      },
      include: {
        platforms: { select: { platform: true } },
        analytics: {
          where: { collectedAt: { gte: range.from, lte: range.to } },
          select: { eventType: true, count: true },
        },
      },
    });

    const platformStats = new Map<string, {
      platform: string;
      totalVideoViews: number;
      watchTime: number;
      completionRate: number;
      totalSaves: number;
      posts: number;
    }>();
    const topVideos = new Map<string, {
      postId: string;
      title: string;
      platform: string;
      videoViews: number;
      saves: number;
      completionRate: number;
    }>();

    for (const post of posts) {
      const platforms = post.platforms
        .map((item) => item.platform)
        .filter((platform) => videoPlatforms.includes(platform));

      for (const platform of platforms) {
        const stats = platformStats.get(platform) ?? {
          platform,
          totalVideoViews: 0,
          watchTime: 0,
          completionRate: 0,
          totalSaves: 0,
          posts: 0,
        };
        const topEntry = topVideos.get(`${post.id}:${platform}`) ?? {
          postId: post.id,
          title: post.title,
          platform,
          videoViews: 0,
          saves: 0,
          completionRate: 0,
        };

        for (const event of post.analytics) {
          const parsed = this.parseEventType(event.eventType, platform);
          if (parsed.platform !== platform) {
            continue;
          }
          const metric = this.normalizeMetric(parsed.metric);
          if (metric === 'video_views') {
            stats.totalVideoViews += event.count;
            topEntry.videoViews += event.count;
          }
          if (metric === 'watch_time') {
            stats.watchTime += event.count;
          }
          if (metric === 'completion_rate') {
            stats.completionRate += event.count;
            topEntry.completionRate += event.count;
          }
          if (metric === 'saves') {
            stats.totalSaves += event.count;
            topEntry.saves += event.count;
          }
        }

        stats.posts += 1;
        platformStats.set(platform, stats);
        topVideos.set(`${post.id}:${platform}`, topEntry);
      }
    }

    return {
      byPlatform: Array.from(platformStats.values()).map((item) => ({
        platform: item.platform,
        totalVideoViews: item.totalVideoViews,
        avgWatchTime: item.posts > 0 ? item.watchTime / item.posts : 0,
        avgCompletionRate: item.posts > 0 ? item.completionRate / item.posts : 0,
        totalSaves: item.totalSaves,
      })),
      topVideosByViews: Array.from(topVideos.values())
        .sort((a, b) => b.videoViews - a.videoViews)
        .slice(0, 5),
    };
  }

  async getPostingHeatmap(teamId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const posts = await this.prisma.post.findMany({
      where: {
        teamId,
        deletedAt: null,
        status: 'published',
        scheduledAt: { gte: since },
      },
      include: {
        analytics: { select: { eventType: true, count: true } },
      },
    });

    const buckets = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ sum: 0, count: 0 })),
    );

    for (const post of posts) {
      if (!post.scheduledAt) {
        continue;
      }
      const scheduledAt = new Date(post.scheduledAt);
      const dow = scheduledAt.getDay();
      const hour = scheduledAt.getHours();
      const engagement = post.analytics.reduce((sum, event) => {
        const metric = this.normalizeMetric(event.eventType.split(':')[1] || event.eventType);
        return metric === 'engagements' || metric === 'likes' || metric === 'comments' || metric === 'shares'
          ? sum + event.count
          : sum;
      }, 0);
      buckets[dow][hour].sum += engagement;
      buckets[dow][hour].count += 1;
    }

    const cells: Array<{ dow: number; hour: number; value: number }> = [];
    for (let dow = 0; dow < 7; dow += 1) {
      for (let hour = 0; hour < 24; hour += 1) {
        const bucket = buckets[dow][hour];
        cells.push({
          dow,
          hour,
          value: bucket.count > 0 ? bucket.sum / bucket.count : 0,
        });
      }
    }

    const maxValue = cells.reduce((max, cell) => Math.max(max, cell.value), 0);
    return {
      cells,
      maxValue,
      bestSlots: [...cells].sort((a, b) => b.value - a.value).slice(0, 5),
    };
  }

  async getEngagementBenchmarks(teamId: string, from?: Date, to?: Date) {
    const roi = await this.getPlatformROI(teamId, from, to);
    return roi
      .filter((item) => PLATFORM_BENCHMARKS[item.platform])
      .map((item) => {
        const benchmark = PLATFORM_BENCHMARKS[item.platform];
        const yourRate = item.impressions > 0 ? (item.engagements / item.impressions) * 100 : 0;
        const rating = yourRate >= benchmark.goodEngagementRate
          ? 'excellent'
          : yourRate >= benchmark.avgEngagementRate * 1.5
            ? 'good'
            : yourRate >= benchmark.avgEngagementRate
              ? 'average'
              : 'below';

        return {
          platform: item.platform,
          yourRate,
          industryAvg: benchmark.avgEngagementRate,
          goodThreshold: benchmark.goodEngagementRate,
          rating,
        };
      });
  }

  async getViralityScores(teamId: string, from?: Date, to?: Date) {
    const range = this.resolveDateRange(from?.toISOString(), to?.toISOString());
    const posts = await this.prisma.post.findMany({
      where: {
        teamId,
        deletedAt: null,
        status: 'published',
      },
      include: {
        platforms: { select: { platform: true } },
        analytics: {
          where: { collectedAt: { gte: range.from, lte: range.to } },
          select: { eventType: true, count: true },
        },
      },
    });

    const topViralPosts: Array<{
      postId: string;
      title: string;
      platform: string;
      viralityScore: number;
      shares: number;
      comments: number;
      impressions: number;
    }> = [];
    const platformTotals = new Map<string, { sum: number; count: number }>();

    for (const post of posts) {
      const platform = post.platforms[0]?.platform ?? 'unknown';
      let shares = 0;
      let comments = 0;
      let impressions = 0;

      for (const event of post.analytics) {
        const metric = this.normalizeMetric(event.eventType.split(':')[1] || event.eventType);
        if (metric === 'shares') shares += event.count;
        if (metric === 'comments') comments += event.count;
        if (metric === 'impressions') impressions += event.count;
      }

      const score = ((shares + comments * 0.5) / Math.max(impressions, 1)) * 100;
      const viralityScore = Number(score.toFixed(2));
      topViralPosts.push({
        postId: post.id,
        title: post.title,
        platform,
        viralityScore,
        shares,
        comments,
        impressions,
      });

      const totals = platformTotals.get(platform) ?? { sum: 0, count: 0 };
      totals.sum += viralityScore;
      totals.count += 1;
      platformTotals.set(platform, totals);
    }

    return {
      topViralPosts: topViralPosts.sort((a, b) => b.viralityScore - a.viralityScore).slice(0, 10),
      avgViralityByPlatform: Array.from(platformTotals.entries()).map(([platform, totals]) => ({
        platform,
        avgVirality: totals.count > 0 ? totals.sum / totals.count : 0,
      })),
    };
  }

  async getDemographics(teamId: string, platform?: string) {
    const rows = await this.prisma.audienceDemographic.findMany({
      where: {
        teamId,
        platform,
      },
      orderBy: { recordedAt: 'desc' },
    }) as Array<{ platform: string; dimension: string; bucket: string; value: number; recordedAt: Date }>;

    const selectedPlatform = platform ?? rows[0]?.platform ?? '';
    const latestByDimension = new Map<string, Date>();
    for (const row of rows) {
      if (row.platform !== selectedPlatform) {
        continue;
      }
      if (!latestByDimension.has(row.dimension)) {
        latestByDimension.set(row.dimension, row.recordedAt);
      }
    }

    const grouped = {
      age: [] as Array<{ bucket: string; value: number }>,
      gender: [] as Array<{ bucket: string; value: number }>,
      country: [] as Array<{ bucket: string; value: number }>,
      city: [] as Array<{ bucket: string; value: number }>,
    };
    let recordedAt: Date | null = null;

    for (const row of rows) {
      const latest = latestByDimension.get(row.dimension);
      if (row.platform !== selectedPlatform || !latest || row.recordedAt.getTime() !== latest.getTime()) {
        continue;
      }
      if (row.dimension === 'age' || row.dimension === 'gender' || row.dimension === 'country' || row.dimension === 'city') {
        grouped[row.dimension].push({ bucket: row.bucket, value: row.value });
        if (!recordedAt || row.recordedAt.getTime() > recordedAt.getTime()) {
          recordedAt = row.recordedAt;
        }
      }
    }

    return {
      platform: selectedPlatform,
      age: grouped.age,
      gender: grouped.gender,
      country: grouped.country.sort((a, b) => b.value - a.value).slice(0, 5),
      city: grouped.city.sort((a, b) => b.value - a.value).slice(0, 5),
      recordedAt: recordedAt?.toISOString() ?? null,
    };
  }

  async upsertDemographics(
    teamId: string,
    platform: string,
    dimension: string,
    buckets: Array<{ bucket: string; value: number }>,
  ) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    await this.prisma.audienceDemographic.deleteMany({
      where: {
        teamId,
        platform,
        dimension,
        recordedAt: { gte: startOfToday },
      },
    });

    if (!buckets.length) {
      return { count: 0 };
    }

    return this.prisma.audienceDemographic.createMany({
      data: buckets.map((bucket) => ({
        teamId,
        platform,
        dimension,
        bucket: bucket.bucket,
        value: bucket.value,
      })),
    });
  }

  async predictEngagement(caption: string, platform: string, brandProfile?: any): Promise<{ predictedEngagement: number; confidence: string; tips: string[] }> {
    const tips: string[] = [];
    let predicted = 50;

    if (caption.length < 100) {
      tips.push('Caption is short — consider adding more detail for better engagement.');
      predicted -= 10;
    } else if (caption.length > 200) {
      tips.push('Long captions perform differently by platform. Test both lengths.');
    }

    if (caption.length > 280) {
      tips.push('Caption exceeds 280 chars — not suitable for X/Twitter without truncating.');
    }

    const hashtags = (caption.match(/#\w+/g) ?? []).length;
    if (hashtags === 0) {
      tips.push('Consider adding 1-3 relevant hashtags to increase discoverability.');
    } else if (hashtags > 5) {
      tips.push('Too many hashtags (>5) can reduce engagement on some platforms.');
    }

    if (caption.includes('?') || caption.includes('CTA')) {
      tips.push('Questions and CTAs tend to drive more comments and shares.');
      predicted += 15;
    }

    predicted = Math.max(10, Math.min(predicted, 500));

    let confidence = 'medium';
    if (brandProfile?.voiceTone) confidence = 'high';

    return { predictedEngagement: predicted, confidence, tips };
  }

  async getContentPerformanceTrends(teamId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const posts = await this.prisma.post.findMany({
      where: {
        teamId,
        deletedAt: null,
        status: 'published',
        scheduledAt: { gte: since },
      },
      include: {
        platforms: { select: { platform: true } },
        analytics: { select: { eventType: true, count: true } },
      },
    });

    const trendingHashtags = new Map<string, number>();
    const contentTypes = new Map<string, number>();

    for (const post of posts) {
      const hashtags = (post.content.match(/#\w+/g) ?? []).map((h: string) => h.toLowerCase());
      for (const tag of hashtags) {
        trendingHashtags.set(tag, (trendingHashtags.get(tag) ?? 0) + 1);
      }

      const type = post.content.length < 100 ? 'short' : post.content.length < 200 ? 'medium' : 'long';
      contentTypes.set(type, (contentTypes.get(type) ?? 0) + 1);
    }

    return {
      topHashtags: Array.from(trendingHashtags.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count })),
      contentTypeBreakdown: Array.from(contentTypes.entries()).map(([type, count]) => ({ type, count })),
    };
  }
}
