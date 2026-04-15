import { executeLeadCatcher } from '@/lib/agents/core-agents/lead-catcher/executor';
import { AgentExecutorContext } from '@/lib/agents/executor-types';

describe('Lead Catcher Agent', () => {
  const baseContext: AgentExecutorContext = {
    agentId: 'lead-catcher-001',
    userId: 'test-user-123',
    runId: 'run-lc-001',
    channel: 'api',
  };

  it('should execute end-to-end workflow', async () => {
    const result = await executeLeadCatcher('Find leads in tech industry', baseContext);
    expect(result.success).toBe(true);
    expect(result.runId).toBe('run-lc-001');
    expect(result.data?.leadsFound).toBe(5);
    expect(result.data?.qualityScore).toBe(85);
  });

  it('should log all 4 sub-agent steps in correct order', async () => {
    const result = await executeLeadCatcher('Test message', baseContext);
    expect(Array.isArray(result.steps)).toBe(true);
    expect(result.steps?.length).toBe(4);
    const stepNames = result.steps?.map((s) => s.stepName);
    expect(stepNames).toEqual(['capture', 'qualify', 'followup', 'notify']);
  });

  it('should mark all steps as completed', async () => {
    const result = await executeLeadCatcher('Test message', baseContext);
    result.steps?.forEach((step) => {
      expect(step.status).toBe('completed');
    });
  });
});
