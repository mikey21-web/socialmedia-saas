import { executeSalesAccelerator } from '@/lib/agents/core-agents/sales-accelerator/executor';
import { AgentExecutorContext } from '@/lib/agents/executor-types';

describe('Sales Accelerator Agent', () => {
  const baseContext: AgentExecutorContext = {
    agentId: 'sales-accelerator-001',
    userId: 'test-user-123',
    runId: 'run-sa-001',
    channel: 'api',
  };

  it('should execute end-to-end workflow', async () => {
    const result = await executeSalesAccelerator('Accelerate SaaS sales', baseContext);
    expect(result.success).toBe(true);
    expect(result.runId).toBe('run-sa-001');
    expect(result.data?.prospectFound).toBe(true);
    expect(result.data?.engagementLevel).toBe('High');
  });

  it('should log all 4 sub-agent steps in correct order', async () => {
    const result = await executeSalesAccelerator('Test message', baseContext);
    expect(Array.isArray(result.steps)).toBe(true);
    expect(result.steps?.length).toBe(4);
    const stepNames = result.steps?.map((s) => s.stepName);
    expect(stepNames).toEqual(['prospecting', 'engagement', 'acceleration', 'closing']);
  });

  it('should mark all steps as completed', async () => {
    const result = await executeSalesAccelerator('Test message', baseContext);
    result.steps?.forEach((step) => {
      expect(step.status).toBe('completed');
    });
  });
});
