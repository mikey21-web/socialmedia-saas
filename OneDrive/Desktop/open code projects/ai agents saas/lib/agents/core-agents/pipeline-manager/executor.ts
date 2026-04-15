import {
  AgentExecutor,
  AgentExecutorContext,
  AgentExecutorResult,
  AgentStepLog,
} from '@/lib/agents/executor-types';
import { trackPipeline } from './tracking';
import { forecastRevenue } from './forecasting';
import { identifyRisk } from './risk';
import { optimizeProcess } from './optimization';

export const executePipelineManager: AgentExecutor = async (
  userMessage: string,
  ctx: AgentExecutorContext
): Promise<AgentExecutorResult> => {
  const steps: AgentStepLog[] = [];

  try {
    const t1 = Date.now();
    const tracking = await trackPipeline(userMessage);
    steps.push({
      stepName: 'tracking',
      status: 'completed',
      durationMs: Date.now() - t1,
      output: { dealsTracked: tracking.dealsTracked },
    });

    const t2 = Date.now();
    const forecast = await forecastRevenue(tracking);
    steps.push({
      stepName: 'forecasting',
      status: 'completed',
      durationMs: Date.now() - t2,
      output: { forecastedRevenue: forecast.forecastedRevenue },
    });

    const t3 = Date.now();
    const risk = await identifyRisk(tracking);
    steps.push({
      stepName: 'risk',
      status: 'completed',
      durationMs: Date.now() - t3,
      output: { riskLevel: risk.riskLevel, risks: risk.risks.length },
    });

    const t4 = Date.now();
    const optimization = await optimizeProcess(forecast);
    steps.push({
      stepName: 'optimization',
      status: 'completed',
      durationMs: Date.now() - t4,
      output: { improvements: optimization.improvements.length },
    });

    const totalDuration = Date.now() - t1;

    return {
      success: true,
      message: `Pipeline managed: ${tracking.dealsTracked} deals, forecast: $${forecast.forecastedRevenue}, risk: ${risk.riskLevel}`,
      runId: ctx.runId,
      data: {
        dealsTracked: tracking.dealsTracked,
        forecastedRevenue: forecast.forecastedRevenue,
        riskLevel: risk.riskLevel,
        improvements: optimization.improvements.length,
        totalDurationMs: totalDuration,
      },
      steps,
    };
  } catch (error) {
    return {
      success: false,
      message: `Pipeline Manager failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      runId: ctx.runId,
      error: error instanceof Error ? error.message : 'Unknown error',
      steps,
    };
  }
};
