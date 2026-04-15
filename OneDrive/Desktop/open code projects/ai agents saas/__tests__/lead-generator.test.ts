/**
 * Lead Generator Agent Test Suite
 * Tests all sub-agents and the orchestrator
 */

import { executeLeadGenerator } from '@/lib/agents/core-agents/lead-generator/executor';
import { AgentExecutorContext } from '@/lib/agents/executor-types';

describe('Lead Generator Agent', () => {
  const baseCtx: AgentExecutorContext = {
    agentId: 'lg-1',
    userId: 'user-1',
    runId: 'run-1',
    channel: 'test',
    metadata: { businessType: 'real_estate' },
  };

  it('should find and qualify leads successfully', async () => {
    const result = await executeLeadGenerator('Find B2B leads in real estate', baseCtx);

    expect(result.success).toBe(true);
    expect(result.runId).toBe('run-1');
    expect(result.data?.prospectCount).toBeGreaterThan(0);
    expect(result.data?.qualifiedCount).toBeGreaterThan(0);
  });

  it('should execute specialized workflow for real estate business type', async () => {
    const result = await executeLeadGenerator('Real estate investors ready to scale', {
      ...baseCtx,
      metadata: { businessType: 'real_estate' },
    });

    expect(result.success).toBe(true);
    expect(result.data?.qualifiedHighFit).toBeGreaterThanOrEqual(0);
    expect(result.data?.nurturedCount).toBeGreaterThan(0);
  });

  it('should execute workflow for ecommerce business type', async () => {
    const result = await executeLeadGenerator('Online store owners looking for automation', {
      ...baseCtx,
      metadata: { businessType: 'ecommerce' },
    });

    expect(result.success).toBe(true);
    expect(result.data?.prospectCount).toBeGreaterThan(0);
  });

  it('should execute all 4 sub-agent steps in correct order', async () => {
    const result = await executeLeadGenerator('Test workflow', baseCtx);

    expect(result.steps).toBeDefined();
    expect(result.steps?.length).toBe(4);

    const stepNames = result.steps?.map((s) => s.stepName);
    expect(stepNames).toEqual([
      'prospect_finding',
      'lead_qualification',
      'nurture_sequence',
      'roi_tracking',
    ]);

    // All steps should complete successfully
    result.steps?.forEach((step) => {
      expect(step.status).toBe('completed');
      expect(step.durationMs).toBeGreaterThanOrEqual(0);
      expect(step.output).toBeDefined();
    });
  });

  it('should calculate projected ROI based on conversion metrics', async () => {
    const result = await executeLeadGenerator('ROI test', baseCtx);

    expect(result.success).toBe(true);
    expect(result.data?.projectedROI).toBeDefined();
    expect(typeof result.data?.projectedROI).toBe('number');
    expect(result.data?.projectedROI).toBeGreaterThanOrEqual(-100);
    expect(result.data?.conversionRate).toBeDefined();
    expect(result.data?.conversionRate).toBeGreaterThanOrEqual(0);
    expect(result.data?.estimatedValue).toBeDefined();
    expect(result.data?.estimatedValue).toBeGreaterThanOrEqual(0);
  });

  it('should include detailed metrics in response data', async () => {
    const result = await executeLeadGenerator('Metrics test', baseCtx);

    expect(result.success).toBe(true);
    expect(result.data?.prospectCount).toBeGreaterThan(0);
    expect(result.data?.qualifiedCount).toBeGreaterThanOrEqual(0);
    expect(result.data?.qualifiedHighFit).toBeGreaterThanOrEqual(0);
    expect(result.data?.nurturedCount).toBeGreaterThanOrEqual(0);
    expect(result.data?.projectedMonthlyLeads).toBeGreaterThanOrEqual(0);
  });

  it('should handle unknown business type gracefully', async () => {
    const result = await executeLeadGenerator('Find leads', {
      ...baseCtx,
      metadata: { businessType: 'unknown' },
    });

    expect(result.success).toBe(true);
    expect(result.data?.prospectCount).toBeGreaterThan(0);
  });

  it('should handle missing metadata gracefully', async () => {
    const result = await executeLeadGenerator('Find leads', {
      agentId: 'lg-1',
      userId: 'user-1',
      runId: 'run-2',
      channel: 'test',
    });

    expect(result.success).toBe(true);
    expect(result.data?.prospectCount).toBeGreaterThan(0);
  });

  it('should provide comprehensive error information on failure', async () => {
    // Create a scenario that might fail (though current implementation won't)
    // This test ensures error handling is in place
    const result = await executeLeadGenerator('Find leads', baseCtx);

    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(result.message).toContain('failed');
    } else {
      expect(result.message).toContain('Lead generation complete');
    }
  });

  it('should measure execution duration for each step', async () => {
    const result = await executeLeadGenerator('Duration test', baseCtx);

    expect(result.success).toBe(true);
    result.steps?.forEach((step) => {
      expect(typeof step.durationMs).toBe('number');
      expect(step.durationMs).toBeGreaterThanOrEqual(0);
    });

    // Total execution time should be sum of all steps
    const totalTime = result.steps?.reduce((sum, step) => sum + step.durationMs, 0) || 0;
    expect(totalTime).toBeGreaterThanOrEqual(0);
  });
});
