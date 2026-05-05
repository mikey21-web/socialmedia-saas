import { PrismaService } from '../../prisma/prisma.service';
import { PlatformsService } from '../../platforms/platforms.service';
import { buildCollectAnalyticsFacebookActivity } from './collect-analytics-facebook';
import { buildCollectAnalyticsInstagramActivity } from './collect-analytics-instagram';
import { buildCollectAnalyticsLinkedInActivity } from './collect-analytics-linkedin';
import { buildCollectAnalyticsTwitterActivity } from './collect-analytics-twitter';
import { AnalyticsMetricRecord } from '../types';

export function createAnalyticsActivities(
  prisma: PrismaService,
  platformsService: PlatformsService,
) {
  return {
    prepareAnalyticsCollection: async (input: {
      postId: string;
      teamId: string;
      platforms: string[];
    }) => {
      const post = await prisma.post.findFirst({
        where: {
          id: input.postId,
          teamId: input.teamId,
          deletedAt: null,
        },
        include: {
          team: {
            select: { ownerId: true },
          },
          platforms: {
            where: {
              platform: { in: input.platforms },
              status: 'published',
            },
            select: {
              platform: true,
              platformPostId: true,
            },
          },
        },
      });

      if (!post) {
        throw new Error('Post not found for analytics collection');
      }

      return {
        postId: post.id,
        userId: post.team.ownerId,
        entries: post.platforms
          .filter((platform) => Boolean(platform.platformPostId))
          .map((platform) => ({
            platform: platform.platform,
            externalId: platform.platformPostId as string,
          })),
      };
    },
    collectAnalyticsTwitter: buildCollectAnalyticsTwitterActivity(platformsService),
    collectAnalyticsInstagram: buildCollectAnalyticsInstagramActivity(platformsService),
    collectAnalyticsLinkedIn: buildCollectAnalyticsLinkedInActivity(platformsService),
    collectAnalyticsFacebook: buildCollectAnalyticsFacebookActivity(platformsService),
    persistAnalyticsMetrics: async (input: {
      postId: string;
      metrics: AnalyticsMetricRecord[];
    }) => {
      const records = input.metrics.flatMap((metric) => {
        const pairs: Array<{ metric: string; value: number | undefined }> = [
          { metric: 'impressions', value: metric.impressions },
          { metric: 'engagements', value: metric.engagements },
          { metric: 'likes', value: metric.likes },
          { metric: 'comments', value: metric.comments },
          { metric: 'clicks', value: metric.clicks },
          { metric: 'followers_growth', value: metric.followers_growth },
        ];
        return pairs
          .filter((pair) => typeof pair.value === 'number')
          .map((pair) => ({
            postId: input.postId,
            eventType: `${metric.platform}:${pair.metric}`,
            count: Math.round(pair.value as number),
          }));
      });

      if (!records.length) {
        return;
      }

      await prisma.analyticsEvent.createMany({
        data: records,
      });
    },
  };
}
