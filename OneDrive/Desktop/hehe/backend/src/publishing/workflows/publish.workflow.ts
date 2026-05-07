import { proxyActivities, startChild, sleep } from '@temporalio/workflow';
import { CollectAnalyticsWorkflowInput, collectAnalyticsWorkflow } from '../../analytics/workflows/collect.workflow';
import { PublishActivityInput, PublishActivityResult, PublishWorkflowInput } from '../types';

type PublishActivities = {
  preparePublishPost: (input: PublishWorkflowInput) => Promise<{
    postId: string;
    jobs: Array<{
      postPlatformId: string;
      postId: string;
      teamId: string;
      userId: string;
      platform: string;
      content: string;
      mediaUrls: string[];
      platformCredentialId?: string;
    }>;
  }>;
  publishTwitter: (input: PublishActivityInput) => Promise<PublishActivityResult>;
  publishInstagram: (input: PublishActivityInput) => Promise<PublishActivityResult>;
  publishLinkedIn: (input: PublishActivityInput) => Promise<PublishActivityResult>;
  publishFacebook: (input: PublishActivityInput) => Promise<PublishActivityResult>;
  publishYouTube: (input: PublishActivityInput) => Promise<PublishActivityResult>;
  publishTikTok: (input: PublishActivityInput) => Promise<PublishActivityResult>;
  finalizePublishPost: (input: {
    postId: string;
    teamId: string;
    results: Array<{
      postPlatformId: string;
      platform: string;
      success: boolean;
      externalId?: string;
      error?: string;
    }>;
  }) => Promise<void>;
  handleRecurringPost: (input: { postId: string; teamId: string }) => Promise<void>;
};

const activities = proxyActivities<PublishActivities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
    nonRetryableErrorTypes: ['AuthError', 'ValidationError', 'ConfigurationError'],
  },
});
const DEFAULT_TASK_QUEUE = 'posts-queue';

export async function publishPostWorkflow(input: PublishWorkflowInput) {
  if (input.scheduledAt) {
    const now = new Date();
    if (input.scheduledAt > now) {
      const delayMs = input.scheduledAt.getTime() - now.getTime();
      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }
  }

  const context = await activities.preparePublishPost(input);

  const results = await Promise.all(
    context.jobs.map(async (job) => {
      const payload: PublishActivityInput = {
        postId: job.postId,
        teamId: job.teamId,
        userId: job.userId,
        platformCredentialId: job.platformCredentialId,
        content: job.content,
        mediaUrls: job.mediaUrls,
      };

      try {
        if (job.platform === 'twitter' || job.platform === 'x') {
          const result = await activities.publishTwitter(payload);
          return { ...result, platform: 'twitter', postPlatformId: job.postPlatformId };
        }
        if (job.platform === 'instagram') {
          const result = await activities.publishInstagram(payload);
          return { ...result, platform: 'instagram', postPlatformId: job.postPlatformId };
        }
        if (job.platform === 'linkedin') {
          const result = await activities.publishLinkedIn(payload);
          return { ...result, platform: 'linkedin', postPlatformId: job.postPlatformId };
        }
        if (job.platform === 'facebook') {
          const result = await activities.publishFacebook(payload);
          return { ...result, platform: 'facebook', postPlatformId: job.postPlatformId };
        }
        if (job.platform === 'youtube') {
          const result = await activities.publishYouTube(payload);
          return { ...result, platform: 'youtube', postPlatformId: job.postPlatformId };
        }
        if (job.platform === 'tiktok') {
          const result = await activities.publishTikTok(payload);
          return { ...result, platform: 'tiktok', postPlatformId: job.postPlatformId };
        }
        return {
          success: false,
          error: `Unsupported platform ${job.platform}`,
          platform: job.platform,
          postPlatformId: job.postPlatformId,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown activity error';
        return {
          success: false,
          error: message,
          platform: job.platform,
          postPlatformId: job.postPlatformId,
        };
      }
    }),
  );

  await activities.finalizePublishPost({
    postId: context.postId,
    teamId: input.teamId,
    results,
  });

  await activities.handleRecurringPost({
    postId: context.postId,
    teamId: input.teamId,
  });

  const publishedPlatforms = results
    .filter((result) => result.success)
    .map((result) => result.platform);

  if (publishedPlatforms.length) {
    const analyticsInput: CollectAnalyticsWorkflowInput = {
      postId: input.postId,
      teamId: input.teamId,
      platforms: publishedPlatforms,
    };
    await startChild(collectAnalyticsWorkflow, {
      taskQueue: input.taskQueue ?? DEFAULT_TASK_QUEUE,
      workflowId: `collect-${input.postId}`,
      args: [analyticsInput],
    });
  }

  return {
    postId: context.postId,
    results,
  };
}
