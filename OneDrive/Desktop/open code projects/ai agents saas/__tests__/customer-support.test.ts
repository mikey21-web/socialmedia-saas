import { executeCustomerSupport } from '@/lib/agents/core-agents/customer-support/executor';

describe('Customer Support Agent', () => {
  const ctx = { agentId: 'cs-1', userId: 'u1', runId: 'r1', channel: 'api' as const };

  it('should handle billing inquiry', async () => {
    const result = await executeCustomerSupport('Why was I charged twice?', ctx);
    expect(result.success).toBe(true);
    expect(result.data?.intent).toBeDefined();
  });

  it('should handle technical issue', async () => {
    const result = await executeCustomerSupport('Product not working on my account', ctx);
    expect(result.success).toBe(true);
    expect(result.steps?.length).toBe(4);
  });

  it('should escalate urgent issues', async () => {
    const result = await executeCustomerSupport('Urgent: system is down!', ctx);
    expect(result.success).toBe(true);
    expect(result.data?.urgency).toBeDefined();
  });

  it('should schedule follow-ups', async () => {
    const result = await executeCustomerSupport('Feature request: dark mode', ctx);
    expect(result.success).toBe(true);
    expect(result.data?.followupScheduled).toBe(true);
  });

  it('should execute 4 sub-agent steps', async () => {
    const result = await executeCustomerSupport('Test support ticket', ctx);
    expect(result.steps?.map(s => s.stepName)).toEqual(['intent_analysis', 'solution_finding', 'escalation_check', 'followup_scheduling']);
  });
});
