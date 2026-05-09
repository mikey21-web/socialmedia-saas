import { proxyActivities } from '@temporalio/workflow';

type EngagementPollActivities = {
  pollEngagementSources: () => Promise<{ processed: number }>;
};

const activities = proxyActivities<EngagementPollActivities>({
  startToCloseTimeout: '5 minutes',
  retry: { maximumAttempts: 2 },
});

export async function engagementPollWorkflow() {
  return activities.pollEngagementSources();
}
