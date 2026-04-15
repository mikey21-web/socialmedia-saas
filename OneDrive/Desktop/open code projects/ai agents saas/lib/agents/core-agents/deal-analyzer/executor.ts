import {
  AgentExecutor,
  AgentExecutorContext,
  AgentExecutorResult,
  AgentStepLog,
} from '@/lib/agents/executor-types';
import { analyzeDeal } from './analysis';
import { scoreDeal } from './scoring';
import { predictOutcome } from './prediction';
import { recommendAction } from './recommendation';

export const executeDealAnalyzer: AgentExecutor = async (
  userMessage: string,
  ctx: AgentExecutorContext
): Promise<AgentExecutorResult> => {
  const steps: AgentStepLog[] = [];

  try {
    const t1 = Date.now();
    const analysis = await analyzeDeal(userMessage);
    steps.push({
      stepName: 'analysis',
      status: 'completed',
      durationMs: Date.now() - t1,
      output: { dealSize: analysis.dealSize, industry: analysis.industry },
    });

    const t2 = Date.now();
    const scoring = await scoreDeal(analysis);
    steps.push({
      stepName: 'scoring',
      status: 'completed',
      durationMs: Date.now() - t2,
      output: { dealScore: scoring.dealScore },
    });

    const t3 = Date.now();
    const prediction = await predictOutcome(analysis);
    steps.push({
      stepName: 'prediction',
      status: 'completed',
      durationMs: Date.now() - t3,
      output: { winProbability: prediction.winProbability },
    });

    const t4 = Date.now();
    const recommendation = await recommendAction(scoring, prediction);
    steps.push({
      stepName: 'recommendation',
      status: 'completed',
      durationMs: Date.now() - t4,
      output: { action: recommendation.recommendedAction },
    });

    const totalDuration = Date.now() - t1;

    return {
      success: true,
      message: `Deal analyzed: score ${scoring.dealScore}, win prob ${prediction.winProbability}%, action: ${recommendation.recommendedAction}`,
      runId: ctx.runId,
      data: {
        dealSize: analysis.dealSize,
        dealScore: scoring.dealScore,
        winProbability: prediction.winProbability,
        recommendedAction: recommendation.recommendedAction,
        riskFactors: recommendation.riskFactors.length,
        totalDurationMs: totalDuration,
      },
      steps,
    };
  } catch (error) {
    return {
      success: false,
      message: `Deal Analyzer failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      runId: ctx.runId,
      error: error instanceof Error ? error.message : 'Unknown error',
      steps,
    };
  }
};
