/**
 * Lead Generator Agent Orchestrator
 * Coordinates all sub-agents: Prospector, Qualifier, Nurture, and Analytics
 */

import { AgentExecutor, AgentExecutorContext, AgentExecutorResult } from '@/lib/agents/executor-types';
import { findProspects } from './prospector';
import { qualifyLeads } from './qualifier';
import { sendNurture } from './nurture';
import { trackROI } from './analytics';

export const executeLeadGenerator: AgentExecutor = async (
  userMessage: string,
  ctx: AgentExecutorContext
): Promise<AgentExecutorResult> => {
  const steps = [];

  try {
    // Extract business type from context metadata or default to 'unknown'
    const businessType =
      (ctx.metadata?.businessType as string) || 'unknown';

    // Step 1: Prospector Agent - Find leads
    const t1 = Date.now();
    const prospects = await findProspects(userMessage, businessType);
    const prospectDuration = Date.now() - t1;
    steps.push({
      stepName: 'prospect_finding',
      status: 'completed' as const,
      durationMs: prospectDuration,
      output: { found: prospects.length, source: 'Multi-channel prospecting' },
    });

    // Step 2: Qualifier Agent - Score and filter leads
    const t2 = Date.now();
    const qualified = await qualifyLeads(prospects);
    const qualifierDuration = Date.now() - t2;
    steps.push({
      stepName: 'lead_qualification',
      status: 'completed' as const,
      durationMs: qualifierDuration,
      output: {
        qualified: qualified.count,
        highFit: qualified.highFitCount,
        mediumFit: qualified.mediumFitCount,
        avgScore: qualified.leads.length > 0
          ? (qualified.leads.reduce((sum, l) => sum + l.qualityScore, 0) / qualified.leads.length).toFixed(2)
          : 'N/A',
      },
    });

    // Step 3: Nurture Agent - Send outreach campaigns
    const t3 = Date.now();
    const nurtured = await sendNurture(qualified.leads);
    const nurtureDuration = Date.now() - t3;
    steps.push({
      stepName: 'nurture_sequence',
      status: 'completed' as const,
      durationMs: nurtureDuration,
      output: {
        sent: nurtured.count,
        channels: ['email', 'linkedin', 'sms'],
        avgDeliveryTimeMs: nurtured.avgDeliveryTime.toFixed(0),
      },
    });

    // Step 4: Analytics Agent - Calculate ROI and metrics
    const t4 = Date.now();
    const roi = await trackROI(prospects, qualified, nurtured);
    const analyticsDuration = Date.now() - t4;
    steps.push({
      stepName: 'roi_tracking',
      status: 'completed' as const,
      durationMs: analyticsDuration,
      output: {
        projectedROI: `${roi.roi}%`,
        conversionRate: `${roi.conversionRate}%`,
        costPerLead: `$${roi.costPerLead}`,
        estimatedValue: `$${roi.estimatedValue}`,
        projectedMonthlyLeads: roi.metrics.projectedMonthlyLeads,
      },
    });

    // Compile final result
    return {
      success: true,
      runId: ctx.runId,
      message: `Lead generation complete: ${prospects.length} prospects found, ${qualified.count} qualified, ${nurtured.count} nurtures sent. Projected ROI: ${roi.roi}%`,
      data: {
        prospectCount: prospects.length,
        qualifiedCount: qualified.count,
        qualifiedHighFit: qualified.highFitCount,
        nurturedCount: nurtured.count,
        projectedROI: roi.roi,
        conversionRate: roi.conversionRate,
        estimatedValue: roi.estimatedValue,
        projectedMonthlyLeads: roi.metrics.projectedMonthlyLeads,
      },
      steps,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    steps.push({
      stepName: 'error_handling',
      status: 'failed' as const,
      durationMs: 0,
      error: errorMessage,
    });

    return {
      success: false,
      runId: ctx.runId,
      message: 'Lead generation failed',
      error: errorMessage,
      steps,
    };
  }
};
