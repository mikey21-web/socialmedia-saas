import {
  AgentExecutor,
  AgentExecutorContext,
  AgentExecutorResult,
  AgentStepLog,
} from '@/lib/agents/executor-types';
import { captureLead } from './capture';
import { qualifyLead } from './qualify';
import { initiateFollowup } from './followup';
import { notifyTeam } from './notify';

export const executeLeadCatcher: AgentExecutor = async (
  userMessage: string,
  ctx: AgentExecutorContext
): Promise<AgentExecutorResult> => {
  const steps: AgentStepLog[] = [];

  try {
    const t1 = Date.now();
    const captured = await captureLead(userMessage);
    steps.push({
      stepName: 'capture',
      status: 'completed',
      durationMs: Date.now() - t1,
      output: { leadsFound: captured.leadsFound },
    });

    const t2 = Date.now();
    const qualified = await qualifyLead(captured);
    steps.push({
      stepName: 'qualify',
      status: 'completed',
      durationMs: Date.now() - t2,
      output: { qualityScore: qualified.qualityScore },
    });

    const t3 = Date.now();
    const followup = await initiateFollowup(qualified);
    steps.push({
      stepName: 'followup',
      status: 'completed',
      durationMs: Date.now() - t3,
      output: { followupSequenceInitiated: followup.initiated },
    });

    const t4 = Date.now();
    const notification = await notifyTeam(qualified);
    steps.push({
      stepName: 'notify',
      status: 'completed',
      durationMs: Date.now() - t4,
      output: { notificationsSent: notification.notificationsSent },
    });

    const totalDuration = Date.now() - t1;

    return {
      success: true,
      message: `Lead caught: ${captured.leadsFound} leads, quality score: ${qualified.qualityScore}`,
      runId: ctx.runId,
      data: {
        leadsFound: captured.leadsFound,
        qualityScore: qualified.qualityScore,
        followupInitiated: followup.initiated,
        notificationsSent: notification.notificationsSent,
        totalDurationMs: totalDuration,
      },
      steps,
    };
  } catch (error) {
    return {
      success: false,
      message: `Lead Catcher failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      runId: ctx.runId,
      error: error instanceof Error ? error.message : 'Unknown error',
      steps,
    };
  }
};
