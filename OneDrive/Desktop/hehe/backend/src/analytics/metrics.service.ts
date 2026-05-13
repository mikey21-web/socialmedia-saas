import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformMetricsFetcher, PlatformPostMetrics } from './platform-metrics-fetcher.service';

export type PlatformMetrics = Omit<PlatformPostMetrics, 'platform'>;

/**
 * Refreshes published-post metrics from real platform APIs every 6 hours.
 * Falls back to in-memory mock data if the fetcher is unavailable so dev/test
 * environments still see realistic numbers.
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly fetcher?: PlatformMetricsFetcher,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async refreshAllMetrics(): Promise<void> {
    this.logger.log('Starting 6-hourly metrics refresh');
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    const teams = await this.prisma.team.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    for (const team of teams) {
      try {
        const posts = await this.prisma.post.findMany({
          where: {
            teamId: team.id,
            status: 'published',
            deletedAt: null,
          },
          include: {
            platforms: {
              where: { platformPostId: { not: null } },
            },
          },
          take: 100,
          orderBy: { scheduledAt: 'desc' },
        });

        for (const post of posts) {
          for (const platform of post.platforms) {
            if (!platform.platformPostId) continue;
            processed++;
            try {
              const metrics = await this.fetchSinglePlatformMetrics(
                platform.platform,
                platform.platformPostId,
                team.id,
              );
              await this.recordMetrics(post.id, platform.platform, metrics);
              succeeded++;
            } catch (err) {
              failed++;
              this.logger.warn(
                `Failed to fetch metrics for post ${post.id} on ${platform.platform}: ${(err as Error)?.message}`,
              );
            }
          }
        }
      } catch (err) {
        this.logger.error(`Failed to refresh metrics for team ${team.id}`, err);
      }
    }

    this.logger.log(`Metrics refresh complete: ${succeeded} succeeded, ${failed} failed of ${processed}`);
  }

  /**
   * Fetch metrics for a single post across all platforms (used by manual refresh).
   */
  async fetchPostMetrics(postId: string): Promise<PlatformMetrics> {
    const post = await this.prisma.post.findFirst({
      where: { id: postId },
      include: {
        platforms: { where: { platformPostId: { not: null } } },
      },
    });

    if (!post || post.platforms.length === 0) {
      return {};
    }

    const totals: PlatformMetrics = {
      reach: 0,
      impressions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    };

    for (const platform of post.platforms) {
      if (!platform.platformPostId) continue;
      const m = await this.fetchSinglePlatformMetrics(
        platform.platform,
        platform.platformPostId,
        post.teamId,
      );
      totals.reach = (totals.reach ?? 0) + (m.reach ?? 0);
      totals.impressions = (totals.impressions ?? 0) + (m.impressions ?? 0);
      totals.likes = (totals.likes ?? 0) + (m.likes ?? 0);
      totals.comments = (totals.comments ?? 0) + (m.comments ?? 0);
      totals.shares = (totals.shares ?? 0) + (m.shares ?? 0);
    }

    return totals;
  }

  async recordMetrics(postId: string, platform: string, metrics: PlatformMetrics): Promise<void> {
    const events: Array<{ postId: string; eventType: string; count: number }> = [];

    const fields: Array<[keyof PlatformMetrics, string]> = [
      ['reach', 'reach'],
      ['impressions', 'impressions'],
      ['likes', 'likes'],
      ['comments', 'comments'],
      ['shares', 'shares'],
      ['saves', 'saves'],
      ['clicks', 'clicks'],
      ['videoViews', 'video_views'],
      ['watchTime', 'watch_time'],
    ];

    for (const [key, eventType] of fields) {
      const value = metrics[key];
      if (typeof value === 'number') {
        events.push({ postId, eventType: `${platform}:${eventType}`, count: value });
      }
    }

    if (events.length === 0) return;

    await this.prisma.$transaction(async (tx) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (const event of events) {
        await tx.analyticsEvent.deleteMany({
          where: {
            postId: event.postId,
            eventType: event.eventType,
            collectedAt: { gte: today },
          },
        });
        await tx.analyticsEvent.create({ data: event });
      }

      const post = await tx.post.findUnique({ where: { id: postId } });
      if (post && (metrics.reach !== undefined || metrics.impressions !== undefined)) {
        await tx.post.update({
          where: { id: postId },
          data: {
            reach: metrics.reach ?? post.reach,
            impressions: metrics.impressions ?? post.impressions,
            metricsUpdatedAt: new Date(),
          },
        });
      }
    });
  }

  private async fetchSinglePlatformMetrics(
    platform: string,
    platformPostId: string,
    teamId: string,
  ): Promise<PlatformMetrics> {
    if (this.fetcher) {
      const result = await this.fetcher.fetchMetrics(platform, platformPostId, teamId);
      return result;
    }
    // Fallback for environments where fetcher isn't injected (tests, init order)
    return this.mockMetricsForPlatform(platform);
  }

  private mockMetricsForPlatform(platform: string): PlatformMetrics {
    this.logger.warn(`Using mock metrics for ${platform} (PlatformMetricsFetcher not available)`);
    const reach = Math.floor(Math.random() * 1000) + 100;
    return {
      reach,
      impressions: Math.floor(reach * 1.8),
      likes: Math.floor(reach * 0.06),
      comments: Math.floor(reach * 0.015),
      shares: Math.floor(reach * 0.01),
    };
  }
}
