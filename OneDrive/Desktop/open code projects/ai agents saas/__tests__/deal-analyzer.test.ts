import { executeDealAnalyzer } from '@/lib/agents/core-agents/deal-analyzer/executor';
import { AgentExecutorContext } from '@/lib/agents/executor-types';

describe('Deal Analyzer Agent', () => {
  const baseContext: AgentExecutorContext = {
    agentId: 'deal-analyzer-001',
    userId: 'test-user-123',
    runId: 'run-da-001',
    channel: 'api',
  };

  it('should execute end-to-end workflow', async () => {
    const result = await executeDealAnalyzer('Analyze $100k SaaS deal', baseContext);
    expect(result.success).toBe(true);
    expect(result.runId).toBe('run-da-001');
    expect(result.data?.dealScore).toBe(78);
    expect(result.data?.winProbability).toBe(82);
  });

  it('should log all 4 sub-agent steps in correct order', async () => {
    const result = await executeDealAnalyzer('Test message', baseContext);
    expect(Array.isArray(result.steps)).toBe(true);
    expect(result.steps?.length).toBe(4);
    const stepNames = result.steps?.map((s) => s.stepName);
    expect(stepNames).toEqual(['analysis', 'scoring', 'prediction', 'recommendation']);
  });

  it('should mark all steps as completed', async () => {
    const result = await executeDealAnalyzer('Test message', baseContext);
    result.steps?.forEach((step) => {
      expect(step.status).toBe('completed');
    });
  });
});
