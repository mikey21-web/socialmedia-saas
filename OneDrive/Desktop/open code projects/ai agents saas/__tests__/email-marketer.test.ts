import { executeEmailMarketer } from '@/lib/agents/core-agents/email-marketer/executor';

describe('Email Marketer Agent', () => {
  const ctx = { agentId: 'em-1', userId: 'u1', runId: 'r1', channel: 'api' as const };

  it('should write email copy', async () => {
    const result = await executeEmailMarketer('Summer sale campaign', ctx);
    expect(result.success).toBe(true);
    expect(result.data?.copyReady).toBe(true);
  });

  it('should segment audience', async () => {
    const result = await executeEmailMarketer('Newsletter to engaged users', ctx);
    expect(result.success).toBe(true);
    expect(result.data?.segmentCount).toBeGreaterThan(0);
  });

  it('should optimize send timing', async () => {
    const result = await executeEmailMarketer('Product launch email', ctx);
    expect(result.success).toBe(true);
    expect(result.data?.optimalSendTime).toBeDefined();
  });

  it('should execute 4 sub-agent steps', async () => {
    const result = await executeEmailMarketer('Test', ctx);
    expect(result.steps?.length).toBe(4);
  });

  it('should project open rates', async () => {
    const result = await executeEmailMarketer('Test email', ctx);
    expect(result.data?.projectedOpenRate).toBeGreaterThan(0);
    expect(result.data?.projectedOpenRate).toBeLessThan(100);
  });
});
