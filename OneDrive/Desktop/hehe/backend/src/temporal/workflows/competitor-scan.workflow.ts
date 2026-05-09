import { proxyActivities } from '@temporalio/workflow';

type CompetitorActivities = {
  scanCompetitors: () => Promise<{ scanned: number }>;
};

const activities = proxyActivities<CompetitorActivities>({
  startToCloseTimeout: '10 minutes',
  retry: { maximumAttempts: 2 },
});

export async function competitorScanWorkflow() {
  return activities.scanCompetitors();
}
