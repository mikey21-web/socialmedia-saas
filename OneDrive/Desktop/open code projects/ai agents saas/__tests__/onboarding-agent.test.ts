import { executeOnboarding } from '@/lib/agents/core-agents/onboarding/executor';
import { AgentExecutorContext, AgentStepLog } from '@/lib/agents/executor-types';

describe('Onboarding Agent', () => {
  const mockContext: AgentExecutorContext = {
    agentId: 'onboarding-1',
    userId: 'user-123',
    runId: 'run-456',
    channel: 'api',
    fromEmail: 'user@example.com',
    metadata: {}
  };

  it('should onboard real estate business', async () => {
    const message = 'Hi, I run a real estate agency in California. We have 25 agents and close 30 deals per year.';
    const result = await executeOnboarding(message, mockContext);

    expect(result.success).toBe(true);
    expect(result.runId).toBe('run-456');
    expect(result.data?.businessType).toBe('real_estate');
    expect(result.steps?.length).toBeGreaterThan(0);
  });

  it('should extract business context from conversation', async () => {
    const message = 'We run an ecommerce fashion store with $500k monthly revenue based in New York.';
    const result = await executeOnboarding(message, mockContext);

    expect(result.success).toBe(true);
    expect(result.data?.businessType).toBe('ecommerce');
    expect(result.data?.industry).toBeDefined();
  });

  it('should route to correct domain template', async () => {
    const message = 'I run an online coaching program with 200 students paying $500/month each.';
    const result = await executeOnboarding(message, mockContext);

    expect(result.success).toBe(true);
    expect(result.data?.domain).toBe('coaching');
    const prompt = result.data?.systemPrompt as string | undefined;
    expect(prompt).toContain('coaching');
  });

  it('should generate system prompt for the business', async () => {
    const message = 'Real estate brokerage in San Francisco.';
    const result = await executeOnboarding(message, mockContext);

    expect(result.success).toBe(true);
    expect(result.data?.systemPrompt).toBeDefined();
    const prompt = result.data?.systemPrompt as string | undefined;
    expect(prompt).toBeTruthy();
    if (prompt) {
      expect(prompt.length).toBeGreaterThan(0);
    }
  });

  it('should log all steps for observability', async () => {
    const message = 'I run a coaching business.';
    const result = await executeOnboarding(message, mockContext);

    expect(result.steps).toBeDefined();
    expect(result.steps?.length).toBeGreaterThanOrEqual(4);
    const stepNames = result.steps?.map((s: AgentStepLog) => s.stepName) || [];
    expect(stepNames).toContain('context_extraction');
    expect(stepNames).toContain('domain_routing');
  });
});
