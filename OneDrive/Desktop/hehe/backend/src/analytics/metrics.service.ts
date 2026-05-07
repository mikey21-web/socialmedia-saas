import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface PlatformMetrics {
  reach?: number;
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async refreshAllMetrics(): Promise<void> {
    this.logger.log('Starting 6-hourly metrics refresh');

    const teams = await this.prisma.team.findMany({
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
              where: {
                platformPostId: { not: null },
              },
            },
          },
        });

        for (const post of posts) {
          for (const platform of post.platforms) {
            if (!platform.platformPostId) continue;

            try {
              const metrics = await this.fetchPostMetrics(post.id);
              await this.recordMetrics(post.id, platform.platform, metrics);
            } catch (err) {
              this.logger.warn(`Failed to fetch metrics for post ${post.id} on ${platform.platform}: ${err}`);
            }
          }
        }
      } catch (err) {
        this.logger.error(`Failed to refresh metrics for team ${team.id}`, err);
      }
    }

    this.logger.log('Metrics refresh complete');
  }

  async fetchPostMetrics(postId: string): Promise<PlatformMetrics> {
    const post = await this.prisma.post.findFirst({
      where: { id: postId },
      include: {
        platforms: {
          where: { platformPostId: { not: null } },
        },
      },
    });

    if (!post || post.platforms.length === 0) {
      return {};
    }

    const platformPostIds = post.platforms.map((p) => ({
      platform: p.platform,
      platformPostId: p.platformPostId!,
    }));

    let totalMetrics: PlatformMetrics = {
      reach: 0,
      impressions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    };

    for (const { platform, platformPostId } of platformPostIds) {
      let platformMetrics: PlatformMetrics;

      switch (platform) {
        case 'instagram':
          platformMetrics = await this.fetchFromInstagram(postId, platformPostId);
          break;
        case 'twitter':
          platformMetrics = await this.fetchFromTwitter(postId, platformPostId);
          break;
        case 'linkedin':
          platformMetrics = await this.fetchFromLinkedIn(postId, platformPostId);
          break;
        case 'facebook':
          platformMetrics = await this.fetchFromFacebook(postId, platformPostId);
          break;
        case 'tiktok':
          platformMetrics = await this.fetchFromTikTok(postId, platformPostId);
          break;
        default:
          this.logger.warn(`Unknown platform: ${platform}`);
          platformMetrics = {};
      }

      totalMetrics.reach = (totalMetrics.reach ?? 0) + (platformMetrics.reach ?? 0);
      totalMetrics.impressions = (totalMetrics.impressions ?? 0) + (platformMetrics.impressions ?? 0);
      totalMetrics.likes = (totalMetrics.likes ?? 0) + (platformMetrics.likes ?? 0);
      totalMetrics.comments = (totalMetrics.comments ?? 0) + (platformMetrics.comments ?? 0);
      totalMetrics.shares = (totalMetrics.shares ?? 0) + (platformMetrics.shares ?? 0);
    }

    return totalMetrics;
  }

  async recordMetrics(postId: string, platform: string, metrics: PlatformMetrics): Promise<void> {
    const events: Array<{ postId: string; eventType: string; count: number }> = [];

    if (metrics.reach !== undefined) {
      events.push({
        postId,
        eventType: `${platform}:reach`,
        count: metrics.reach,
      });
    }
    if (metrics.impressions !== undefined) {
      events.push({
        postId,
        eventType: `${platform}:impressions`,
        count: metrics.impressions,
      });
    }
    if (metrics.likes !== undefined) {
      events.push({
        postId,
        eventType: `${platform}:likes`,
        count: metrics.likes,
      });
    }
    if (metrics.comments !== undefined) {
      events.push({
        postId,
        eventType: `${platform}:comments`,
        count: metrics.comments,
      });
    }
    if (metrics.shares !== undefined) {
      events.push({
        postId,
        eventType: `${platform}:shares`,
        count: metrics.shares,
      });
    }

    if (events.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const event of events) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
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
  }

  private async fetchFromInstagram(_postId: string, _platformPostId: string): Promise<PlatformMetrics> {
    this.logger.warn('Using mock metrics for instagram - real API not configured');
    const mockReach = Math.floor(Math.random() * 1000);
    const mockImpressions = Math.floor(mockReach * (2 + Math.random() * 2));
    return {
      reach: mockReach,
      impressions: mockImpressions,
      likes: Math.floor(mockReach * 0.1),
      comments: Math.floor(mockReach * 0.02),
      shares: Math.floor(mockReach * 0.01),
    };
  }

  private async fetchFromTwitter(_postId: string, _platformPostId: string): Promise<PlatformMetrics> {
    this.logger.warn('Using mock metrics for twitter - real API not configured');
    const mockImpressions = Math.floor(Math.random() * 800 + 200);
    const mockReach = Math.floor(mockImpressions * 0.6);
    return {
      reach: mockReach,
      impressions: mockImpressions,
      likes: Math.floor(mockImpressions * 0.05),
      comments: Math.floor(mockImpressions * 0.01),
      shares: Math.floor(mockImpressions * 0.02),
    };
  }

  private async fetchFromLinkedIn(_postId: string, _platformPostId: string): Promise<PlatformMetrics> {
    this.logger.warn('Using mock metrics for linkedin - real API not configured');
    const mockImpressions = Math.floor(Math.random() * 600 + 100);
    const mockReach = Math.floor(mockImpressions * 0.7);
    return {
      reach: mockReach,
      impressions: mockImpressions,
      likes: Math.floor(mockImpressions * 0.04),
      comments: Math.floor(mockImpressions * 0.02),
      shares: Math.floor(mockImpressions * 0.01),
    };
  }

  private async fetchFromFacebook(_postId: string, _platformPostId: string): Promise<PlatformMetrics> {
    this.logger.warn('Using mock metrics for facebook - real API not configured');
    const mockReach = Math.floor(Math.random() * 500 + 50);
    const mockImpressions = Math.floor(mockReach * 1.5);
    return {
      reach: mockReach,
      impressions: mockImpressions,
      likes: Math.floor(mockImpressions * 0.03),
      comments: Math.floor(mockImpressions * 0.01),
      shares: Math.floor(mockImpressions * 0.005),
    };
  }

  private async fetchFromTikTok(_postId: string, _platformPostId: string): Promise<PlatformMetrics> {
    this.logger.warn('Using mock metrics for tiktok - real API not configured');
    const mockReach = Math.floor(Math.random() * 2000 + 100);
    const mockImpressions = Math.floor(mockReach * 3);
    return {
      reach: mockReach,
      impressions: mockImpressions,
      likes: Math.floor(mockImpressions * 0.08),
      comments: Math.floor(mockImpressions * 0.03),
      shares: Math.floor(mockImpressions * 0.02),
    };
  }
}