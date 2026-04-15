/**
 * Sales Closer Agent Executor
 * Orchestrates 4 sub-agents to analyze, handle objections, create urgency, and close deals
 */

import { AgentExecutor, AgentExecutorContext, AgentExecutorResult } from '@/lib/agents/executor-types';
import { analyzeTemperature } from './temperature';
import { handleObjection } from './objection';
import { createUrgency } from './urgency';
import { closeDeal } from './closer';

export const executeSalesCloser: AgentExecutor = async (
  userMessage: string,
  ctx: AgentExecutorContext
): Promise<AgentExecutorResult> => {
  const steps = [];

  try {
    // Step 1: Analyze temperature
    const t1 = Date.now();
    const tempAnalysis = await analyzeTemperature(userMessage);
    steps.push({
      stepName: 'temperature_analysis',
      status: 'completed' as const,
      durationMs: Date.now() - t1,
      output: {
        temperature: tempAnalysis.score,
        readiness: tempAnalysis.readiness,
        signals: tempAnalysis.signals,
      },
    });

    // Step 2: Handle objections
    const t2 = Date.now();
    const objectionResult = await handleObjection(tempAnalysis.objections);
    steps.push({
      stepName: 'objection_handling',
      status: 'completed' as const,
      durationMs: Date.now() - t2,
      output: {
        addressed: objectionResult.count,
        successRate: objectionResult.successRate,
        responses: objectionResult.addressed,
      },
    });

    // Step 3: Create urgency
    const t3 = Date.now();
    const urgencyStrategy = await createUrgency(tempAnalysis.score);
    steps.push({
      stepName: 'urgency_creation',
      status: 'completed' as const,
      durationMs: Date.now() - t3,
      output: {
        urgencyLevel: urgencyStrategy.level,
        tactics: urgencyStrategy.tactics,
        message: urgencyStrategy.message,
      },
    });

    // Step 4: Close deal
    const t4 = Date.now();
    const closingStrategy = await closeDeal(tempAnalysis.score, objectionResult.count, urgencyStrategy.level);
    steps.push({
      stepName: 'deal_closing',
      status: 'completed' as const,
      durationMs: Date.now() - t4,
      output: {
        approach: closingStrategy.approach,
        closingSuccessRate: closingStrategy.successRate,
        nextSteps: closingStrategy.nextSteps,
        recommendedAction: closingStrategy.recommendedAction,
      },
    });

    return {
      success: true,
      runId: ctx.runId,
      message: `Sales closing analysis complete. Deal temperature: ${tempAnalysis.score}/100 (${tempAnalysis.readiness}). Addressed ${objectionResult.count} objections with ${objectionResult.successRate}% success rate. Recommended approach: ${closingStrategy.approach}. Closing success probability: ${closingStrategy.successRate}%`,
      data: {
        temperature: tempAnalysis.score,
        readiness: tempAnalysis.readiness,
        objectionsHandled: objectionResult.count,
        objectionSuccessRate: objectionResult.successRate,
        urgencyLevel: urgencyStrategy.level,
        closingApproach: closingStrategy.approach,
        closingRate: closingStrategy.successRate,
        recommendedAction: closingStrategy.recommendedAction,
      },
      steps,
    };
  } catch (error) {
    return {
      success: false,
      runId: ctx.runId,
      message: 'Sales closing analysis failed',
      error: String(error),
      steps,
    };
  }
};
