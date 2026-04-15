import { executeContentEngine } from '@/lib/agents/core-agents/content-engine/executor';
import { AgentExecutorContext } from '@/lib/agents/executor-types';

describe('Content Engine Agent', () => {
  const baseContext: AgentExecutorContext = {
    agentId: 'content-engine-001',
    userId: 'test-user-123',
    runId: 'run-ce-001',
    channel: 'api',
  };

  it('should execute end-to-end workflow', async () => {
    const result = await executeContentEngine('Write about AI trends', baseContext);
    expect(result.success).toBe(true);
    expect(result.runId).toBe('run-ce-001');
    expect(result.data?.wordCount).toBe(2000);
    expect(result.data?.channels).toBe(3);
  });

  it('should log all 4 sub-agent steps in correct order', async () => {
    const result = await executeContentEngine('Test message', baseContext);
    expect(Array.isArray(result.steps)).toBe(true);
    expect(result.steps?.length).toBe(4);
    const stepNames = result.steps?.map((s) => s.stepName);
    expect(stepNames).toEqual(['research', 'writing', 'formatting', 'distribution']);
  });

  it('should mark all steps as completed', async () => {
    const result = await executeContentEngine('Test message', baseContext);
    result.steps?.forEach((step) => {
      expect(step.status).toBe('completed');
    });
  });
});
