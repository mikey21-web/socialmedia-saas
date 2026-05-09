import { proxyActivities } from '@temporalio/workflow';

export interface DailyCycleWorkflowInput {
  teamId: string;
}

type AgencyActivities = {
  runDailyAgencyCycle: (input: DailyCycleWorkflowInput) => Promise<{
    postsGenerated: number;
    engagementProcessed: number;
  }>;
};

const activities = proxyActivities<AgencyActivities>({
  startToCloseTimeout: '10 minutes',
  retry: { maximumAttempts: 2 },
});

export async function dailyCycleWorkflow(input: DailyCycleWorkflowInput) {
  return activities.runDailyAgencyCycle(input);
}
