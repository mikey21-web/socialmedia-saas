import {
  AgentExecutor,
  AgentExecutorContext,
  AgentExecutorResult,
  AgentStepLog,
} from '@/lib/agents/executor-types';
import { conductProspecting } from './prospecting';
import { engageProspect } from './engagement';
import { accelerateDeal } from './acceleration';
import { closeDeal } from './closing';

export const executeSalesAccelerator: AgentExecutor = async (
  userMessage: string,
  ctx: AgentExecutorContext
): Promise<AgentExecutorResult> => {
  const steps: AgentStepLog[] = [];

  try {
    const t1 = Date.now();
    const prospecting = await conductProspecting(userMessage);
    steps.push({
      stepName: 'prospecting',
      status: 'completed',
      durationMs: Date.now() - t1,
      output: { prospectFound: prospecting.prospectFound },
    });

    const t2 = Date.now();
    const engagement = await engageProspect(prospecting);
    steps.push({
      stepName: 'engagement',
      status: 'completed',
      durationMs: Date.now() - t2,
      output: { engagementLevel: engagement.engagementLevel },
    });

    const t3 = Date.now();
    const acceleration = await accelerateDeal(engagement);
    steps.push({
      stepName: 'acceleration',
      status: 'completed',
      durationMs: Date.now() - t3,
      output: { dealStage: acceleration.dealStage },
    });

    const t4 = Date.now();
    const closing = await closeDeal(acceleration);
    steps.push({
      stepName: 'closing',
      status: 'completed',
      durationMs: Date.now() - t4,
      output: { closingProbability: closing.closingProbability },
    });

    const totalDuration = Date.now() - t1;

    return {
      success: true,
      message: `Sales accelerated: prospect found, engagement: ${engagement.engagementLevel}, deal stage: ${acceleration.dealStage}`,
      runId: ctx.runId,
      data: {
        prospectFound: prospecting.prospectFound,
        engagementLevel: engagement.engagementLevel,
        dealStage: acceleration.dealStage,
        closingProbability: closing.closingProbability,
        totalDurationMs: totalDuration,
      },
      steps,
    };
  } catch (error) {
    return {
      success: false,
      message: `Sales Accelerator failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      runId: ctx.runId,
      error: error instanceof Error ? error.message : 'Unknown error',
      steps,
    };
  }
};
