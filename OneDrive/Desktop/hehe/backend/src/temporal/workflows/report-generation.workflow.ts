import { proxyActivities } from '@temporalio/workflow';

export interface ReportGenerationWorkflowInput {
  teamId: string;
  type: 'daily' | 'weekly' | 'monthly';
}

type ReportActivities = {
  generateAgencyReport: (input: ReportGenerationWorkflowInput) => Promise<{ reportType: string }>;
};

const activities = proxyActivities<ReportActivities>({
  startToCloseTimeout: '10 minutes',
  retry: { maximumAttempts: 2 },
});

export async function reportGenerationWorkflow(input: ReportGenerationWorkflowInput) {
  return activities.generateAgencyReport(input);
}
