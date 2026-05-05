import { proxyActivities, sleep } from '@temporalio/workflow';
import { AnalyticsMetricRecord } from '../types';

export type CollectAnalyticsWorkflowInput = {
  postId: string;
  teamId: string;
  platforms: string[];
};

type AnalyticsActivities = {
  prepareAnalyticsCollection: (input: CollectAnalyticsWorkflowInput) => Promise<{
    postId: string;
    userId: string;
    entries: Array<{ platform: string; externalId: string }>;
  }>;
  collectAnalyticsTwitter: (input: {
    externalId: string;
    postId: string;
    userId: string;
  }) => Promise<AnalyticsMetricRecord>;
  collectAnalyticsInstagram: (input: {
    externalId: string;
    postId: string;
    userId: string;
  }) => Promise<AnalyticsMetricRecord>;
  collectAnalyticsLinkedIn: (input: {
    externalId: string;
    postId: string;
    userId: string;
  }) => Promise<AnalyticsMetricRecord>;
  collectAnalyticsFacebook: (input: {
    externalId: string;
    postId: string;
    userId: string;
  }) => Promise<AnalyticsMetricRecord>;
  persistAnalyticsMetrics: (input: {
    postId: string;
    metrics: AnalyticsMetricRecord[];
  }) => Promise<void>;
};

const activities = proxyActivities<AnalyticsActivities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
  },
});

export async function collectAnalyticsWorkflow(input: CollectAnalyticsWorkflowInput) {
  await sleep('1 hour');
  const context = await activities.prepareAnalyticsCollection(input);

  const metrics = await Promise.all(
    context.entries.map(async (entry) => {
      if (entry.platform === 'twitter' || entry.platform === 'x') {
        return activities.collectAnalyticsTwitter({
          externalId: entry.externalId,
          postId: context.postId,
          userId: context.userId,
        });
      }
      if (entry.platform === 'instagram') {
        return activities.collectAnalyticsInstagram({
          externalId: entry.externalId,
          postId: context.postId,
          userId: context.userId,
        });
      }
      if (entry.platform === 'linkedin') {
        return activities.collectAnalyticsLinkedIn({
          externalId: entry.externalId,
          postId: context.postId,
          userId: context.userId,
        });
      }
      if (entry.platform === 'facebook') {
        return activities.collectAnalyticsFacebook({
          externalId: entry.externalId,
          postId: context.postId,
          userId: context.userId,
        });
      }
      return {
        platform: entry.platform,
        externalId: entry.externalId,
      } satisfies AnalyticsMetricRecord;
    }),
  );

  await activities.persistAnalyticsMetrics({
    postId: context.postId,
    metrics,
  });

  const total = metrics.reduce(
    (acc, metric) => ({
      impressions: acc.impressions + (metric.impressions ?? 0),
      engagements: acc.engagements + (metric.engagements ?? 0),
      likes: acc.likes + (metric.likes ?? 0),
      comments: acc.comments + (metric.comments ?? 0),
    }),
    { impressions: 0, engagements: 0, likes: 0, comments: 0 },
  );

  return {
    postId: context.postId,
    metrics,
    total,
  };
}
