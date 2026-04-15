import { AgentExecutor, AgentExecutorContext, AgentExecutorResult, AgentStepLog } from '@/lib/agents/executor-types';
import { analyzeIntent } from './intent';
import { findSolution } from './solution';
import { handleEscalation } from './escalation';
import { scheduleFollowup } from './followup';

export const executeCustomerSupport: AgentExecutor = async (userMessage: string, ctx: AgentExecutorContext): Promise<AgentExecutorResult> => {
  const steps: AgentStepLog[] = [];
  try {
    const t1 = Date.now();
    const intent = await analyzeIntent(userMessage);
    steps.push({ stepName: 'intent_analysis', status: 'completed', durationMs: Date.now() - t1, output: { intent: intent.type, urgency: intent.urgency } });

    const t2 = Date.now();
    const solution = await findSolution(intent.type);
    steps.push({ stepName: 'solution_finding', status: 'completed', durationMs: Date.now() - t2, output: { solutionFound: solution.found } });

    const t3 = Date.now();
    const escalated = await handleEscalation(intent.urgency, solution.found);
    steps.push({ stepName: 'escalation_check', status: 'completed', durationMs: Date.now() - t3, output: { escalated: escalated.needed } });

    const t4 = Date.now();
    const followup = await scheduleFollowup(intent.type, escalated.needed);
    steps.push({ stepName: 'followup_scheduling', status: 'completed', durationMs: Date.now() - t4, output: { followupScheduled: followup.scheduled } });

    return {
      success: true,
      runId: ctx.runId,
      message: `Support ticket processed. Intent: ${intent.type}. Solution: ${solution.found ? 'found' : 'escalated'}. Follow-up scheduled: ${followup.scheduled}`,
      data: { intent: intent.type, urgency: intent.urgency, solutionFound: solution.found, escalated: escalated.needed, followupScheduled: followup.scheduled },
      steps
    };
  } catch (error) {
    return { success: false, runId: ctx.runId, message: 'Support failed', error: String(error), steps };
  }
};
