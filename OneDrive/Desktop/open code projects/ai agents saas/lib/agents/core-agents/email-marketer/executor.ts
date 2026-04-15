import { AgentExecutor, AgentExecutorContext, AgentExecutorResult, AgentStepLog } from '@/lib/agents/executor-types';
import { writeCopy } from './copywriter';
import { segmentAudience } from './segmenter';
import { optimizeTiming } from './timing';
import { analyzePerformance } from './analytics';

export const executeEmailMarketer: AgentExecutor = async (userMessage: string, ctx: AgentExecutorContext): Promise<AgentExecutorResult> => {
  const steps: AgentStepLog[] = [];
  try {
    const t1 = Date.now();
    const copy = await writeCopy(userMessage);
    steps.push({ stepName: 'copy_writing', status: 'completed', durationMs: Date.now() - t1, output: { subject: copy.subject } });

    const t2 = Date.now();
    const segments = await segmentAudience(userMessage);
    steps.push({ stepName: 'audience_segmentation', status: 'completed', durationMs: Date.now() - t2, output: { segments: segments.count } });

    const t3 = Date.now();
    const timing = await optimizeTiming(segments.segments);
    steps.push({ stepName: 'send_timing_optimization', status: 'completed', durationMs: Date.now() - t3, output: { sendTime: timing.optimalTime } });

    const t4 = Date.now();
    const analytics = await analyzePerformance(copy, segments, timing);
    steps.push({ stepName: 'performance_analytics', status: 'completed', durationMs: Date.now() - t4, output: { projectedOpenRate: analytics.openRate } });

    return {
      success: true,
      runId: ctx.runId,
      message: `Email campaign ready: "${copy.subject}" to ${segments.count} segments. Projected open rate: ${analytics.openRate}%`,
      data: { copyReady: true, segmentCount: segments.count, optimalSendTime: timing.optimalTime, projectedOpenRate: analytics.openRate },
      steps
    };
  } catch (error) {
    return { success: false, runId: ctx.runId, message: 'Email campaign failed', error: String(error), steps };
  }
};
