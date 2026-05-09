import { proxyActivities } from '@temporalio/workflow';

type TrendActivities = {
  scanTrendSources: () => Promise<{ inserted: number; expired: number }>;
};

const activities = proxyActivities<TrendActivities>({
  startToCloseTimeout: '5 minutes',
  retry: { maximumAttempts: 2 },
});

export async function trendMonitorWorkflow() {
  return activities.scanTrendSources();
}
