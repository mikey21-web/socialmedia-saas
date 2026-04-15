import { executePipelineManager } from '@/lib/agents/core-agents/pipeline-manager/executor';
import { AgentExecutorContext } from '@/lib/agents/executor-types';

describe('Pipeline Manager Agent', () => {
  const baseContext: AgentExecutorContext = {
    agentId: 'pipeline-manager-001',
    userId: 'test-user-123',
    runId: 'run-pm-001',
    channel: 'api',
  };

  it('should execute end-to-end workflow', async () => {
    const result = await executePipelineManager('Track Q2 pipeline', baseContext);
    expect(result.success).toBe(true);
    expect(result.runId).toBe('run-pm-001');
    expect(result.data?.dealsTracked).toBe(25);
    expect(result.data?.forecastedRevenue).toBe(250000);
  });

  it('should log all 4 sub-agent steps in correct order', async () => {
    const result = await executePipelineManager('Test message', baseContext);
    expect(Array.isArray(result.steps)).toBe(true);
    expect(result.steps?.length).toBe(4);
    const stepNames = result.steps?.map((s) => s.stepName);
    expect(stepNames).toEqual(['tracking', 'forecasting', 'risk', 'optimization']);
  });

  it('should mark all steps as completed', async () => {
    const result = await executePipelineManager('Test message', baseContext);
    result.steps?.forEach((step) => {
      expect(step.status).toBe('completed');
    });
  });
});
