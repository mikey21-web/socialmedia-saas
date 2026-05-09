import { proxyActivities, sleep } from '@temporalio/workflow';

export interface MetricsCollectionWorkflowInput {
  postId: string;
  teamId: string;
}

type MetricsActivities = {
  collectPostMetrics: (input: MetricsCollectionWorkflowInput) => Promise<{ captured: number }>;
};

const activities = proxyActivities<MetricsActivities>({
  startToCloseTimeout: '5 minutes',
  retry: { maximumAttempts: 3 },
});

export async function metricsCollectionWorkflow(input: MetricsCollectionWorkflowInput) {
  const captures: Array<{ captured: number }> = [];
  for (let i = 0; i < 48; i++) {
    captures.push(await activities.collectPostMetrics(input));
    await sleep('1 hour');
  }
  for (let i = 0; i < 7; i++) {
    captures.push(await activities.collectPostMetrics(input));
    await sleep('1 day');
  }
  return { captures };
}
