/**
 * Sales Closer Agent Test Suite
 * Tests the complete sales closing workflow with all 4 sub-agents
 */

import { executeSalesCloser } from '@/lib/agents/core-agents/sales-closer/executor';
import { AgentExecutorContext } from '@/lib/agents/executor-types';

describe('Sales Closer Agent', () => {
  const createContext = (runId = 'run-test-1'): AgentExecutorContext => ({
    agentId: 'sales-closer-1',
    userId: 'user-test-1',
    runId,
    channel: 'api',
  });

  describe('Temperature Analysis', () => {
    it('should analyze and return a temperature score between 0-100', async () => {
      const result = await executeSalesCloser('Client interested in premium plan', createContext());
      expect(result.success).toBe(true);
      expect(result.data?.temperature).toBeGreaterThanOrEqual(0);
      expect(result.data?.temperature).toBeLessThanOrEqual(100);
    });

    it('should identify readiness status (cold, warm, or hot)', async () => {
      const result = await executeSalesCloser('Very interested, ready to sign today', createContext());
      expect(result.success).toBe(true);
      expect(['cold', 'warm', 'hot']).toContain(result.data?.readiness);
    });
  });

  describe('Objection Handling', () => {
    it('should handle objections and return success rate', async () => {
      const result = await executeSalesCloser('Price too high, need to review budget', createContext());
      expect(result.success).toBe(true);
      expect(result.data?.objectionsHandled).toBeGreaterThanOrEqual(0);
      expect(result.data?.objectionSuccessRate).toBeGreaterThanOrEqual(0);
      expect(result.data?.objectionSuccessRate).toBeLessThanOrEqual(100);
    });

    it('should provide objection responses in step output', async () => {
      const result = await executeSalesCloser('Concerned about implementation timeline', createContext());
      expect(result.success).toBe(true);
      const objectionStep = result.steps?.find(s => s.stepName === 'objection_handling');
      expect(objectionStep).toBeDefined();
      expect((objectionStep?.output as any)?.responses).toBeDefined();
      expect(Array.isArray((objectionStep?.output as any)?.responses)).toBe(true);
    });
  });

  describe('Urgency Strategy', () => {
    it('should create appropriate urgency level based on temperature', async () => {
      const result = await executeSalesCloser('Client seems interested', createContext());
      expect(result.success).toBe(true);
      expect(['low', 'medium', 'high']).toContain(result.data?.urgencyLevel);
    });

    it('should provide urgency tactics in step output', async () => {
      const result = await executeSalesCloser('Ready to proceed with implementation', createContext());
      expect(result.success).toBe(true);
      const urgencyStep = result.steps?.find(s => s.stepName === 'urgency_creation');
      expect(urgencyStep).toBeDefined();
      expect((urgencyStep?.output as any)?.tactics).toBeDefined();
      expect(Array.isArray((urgencyStep?.output as any)?.tactics)).toBe(true);
    });
  });

  describe('Deal Closing Strategy', () => {
    it('should calculate closing success rate between 0-100', async () => {
      const result = await executeSalesCloser('Client ready to close', createContext());
      expect(result.success).toBe(true);
      expect(result.data?.closingRate).toBeGreaterThanOrEqual(0);
      expect(result.data?.closingRate).toBeLessThanOrEqual(100);
    });

    it('should recommend appropriate closing approach', async () => {
      const result = await executeSalesCloser('Test deal closure', createContext());
      expect(result.success).toBe(true);
      expect(['Direct Close', 'Consultative Close', 'Relationship Building']).toContain(
        result.data?.closingApproach
      );
    });

    it('should provide recommended action for sales rep', async () => {
      const result = await executeSalesCloser('Client inquiry about our services', createContext());
      expect(result.success).toBe(true);
      expect(result.data?.recommendedAction).toBeDefined();
      expect(typeof result.data?.recommendedAction).toBe('string');
      expect((result.data?.recommendedAction as string)?.length).toBeGreaterThan(0);
    });
  });

  describe('Orchestration & Integration', () => {
    it('should execute all 4 sub-agent steps in correct order', async () => {
      const result = await executeSalesCloser('Full closing test', createContext('run-full-test'));
      expect(result.success).toBe(true);
      expect(result.steps?.length).toBe(4);
      expect(result.steps?.map(s => s.stepName)).toEqual([
        'temperature_analysis',
        'objection_handling',
        'urgency_creation',
        'deal_closing',
      ]);
    });

    it('should record timing information for each step', async () => {
      const result = await executeSalesCloser('Timing test', createContext());
      expect(result.success).toBe(true);
      result.steps?.forEach(step => {
        expect(step.durationMs).toBeGreaterThanOrEqual(0);
        expect(typeof step.durationMs).toBe('number');
      });
    });

    it('should include comprehensive data in result output', async () => {
      const result = await executeSalesCloser('Comprehensive data test', createContext());
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          temperature: expect.any(Number),
          readiness: expect.stringMatching(/^(cold|warm|hot)$/),
          objectionsHandled: expect.any(Number),
          objectionSuccessRate: expect.any(Number),
          urgencyLevel: expect.stringMatching(/^(low|medium|high)$/),
          closingApproach: expect.any(String),
          closingRate: expect.any(Number),
          recommendedAction: expect.any(String),
        })
      );
    });

    it('should maintain runId across all steps', async () => {
      const testRunId = 'run-id-preservation-test';
      const result = await executeSalesCloser('RunId test', createContext(testRunId));
      expect(result.success).toBe(true);
      expect(result.runId).toBe(testRunId);
      result.steps?.forEach(step => {
        expect(step.status).toBe('completed');
      });
    });

    it('should provide meaningful summary message', async () => {
      const result = await executeSalesCloser('Summary message test', createContext());
      expect(result.success).toBe(true);
      expect(result.message).toContain('Sales closing analysis complete');
      expect(result.message).toContain('Deal temperature');
      expect(result.message).toContain('objections');
    });
  });

  describe('Error Handling', () => {
    it('should handle edge cases gracefully', async () => {
      const result = await executeSalesCloser('', createContext());
      expect(result.success).toBe(true); // Even with empty input, should complete
      expect(result.steps?.length).toBe(4);
    });

    it('should include error information if execution fails', async () => {
      // This test verifies error structure; actual failures would need mocked failures
      const result = await executeSalesCloser('Normal test', createContext());
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });
  });
});
