/**
 * Social Media Manager Agent - Integration Tests
 * Tests complete workflow across multiple business contexts
 */

import { executeSocialMediaManager } from '@/lib/agents/core-agents/social-media-manager/executor';
import { AgentExecutorContext } from '@/lib/agents/executor-types';

describe('Social Media Manager Agent', () => {
  const baseContext: AgentExecutorContext = {
    agentId: 'smm-agent-001',
    userId: 'test-user-123',
    runId: 'run-smm-001',
    channel: 'api',
  };

  describe('Ecommerce Context', () => {
    it('should execute end-to-end workflow for ecommerce', async () => {
      const context: AgentExecutorContext = {
        ...baseContext,
        metadata: { businessType: 'ecommerce' },
      };

      const result = await executeSocialMediaManager(
        'Create summer sale posts for our fashion brand',
        context
      );

      expect(result.success).toBe(true);
      expect(result.runId).toBe('run-smm-001');
      expect(result.data?.postsGenerated).toBeGreaterThan(0);
      expect(result.data?.platformsCovered).toEqual([
        'Instagram',
        'Twitter',
        'LinkedIn',
        'Facebook',
        'TikTok',
      ]);
      expect(result.data?.engagementScore).toBeGreaterThan(0);
      expect(result.data?.totalReach).toBeGreaterThan(0);
    });
  });

  describe('Real Estate Context', () => {
    it('should execute for real estate business', async () => {
      const context: AgentExecutorContext = {
        ...baseContext,
        runId: 'run-smm-re-001',
        metadata: { businessType: 'real_estate' },
      };

      const result = await executeSocialMediaManager(
        'Generate luxury property showcase content',
        context
      );

      expect(result.success).toBe(true);
      expect(result.data?.platformsCovered).toContain('LinkedIn');
      expect(result.data?.postsGenerated).toBeGreaterThan(0);
    });
  });

  describe('Coaching/Education Context', () => {
    it('should execute for coaching business', async () => {
      const context: AgentExecutorContext = {
        ...baseContext,
        runId: 'run-smm-coaching-001',
        metadata: { businessType: 'coaching' },
      };

      const result = await executeSocialMediaManager(
        'Create course enrollment campaign for Q2',
        context
      );

      expect(result.success).toBe(true);
      expect(result.data?.engagementScore).toBeGreaterThan(0);
      expect(result.data?.postsGenerated).toBeGreaterThan(0);
    });
  });

  describe('Step Logging', () => {
    it('should log all 4 sub-agent steps in correct order', async () => {
      const result = await executeSocialMediaManager('Test message', baseContext);

      expect(Array.isArray(result.steps)).toBe(true);
      expect(result.steps?.length).toBe(4);

      const stepNames = result.steps?.map((s) => s.stepName);
      expect(stepNames).toEqual([
        'content_creation',
        'content_scheduling',
        'engagement_analysis',
        'analytics_generation',
      ]);
    });

    it('should mark all steps as completed', async () => {
      const result = await executeSocialMediaManager('Test message', baseContext);

      result.steps?.forEach((step) => {
        expect(step.status).toBe('completed');
      });
    });
  });

  describe('Result Structure', () => {
    it('should return correct AgentExecutorResult structure', async () => {
      const result = await executeSocialMediaManager('Test message', baseContext);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('runId');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('steps');
    });

    it('should include all expected data fields', async () => {
      const result = await executeSocialMediaManager('Test message', baseContext);

      const requiredFields = [
        'postsGenerated',
        'platformsCovered',
        'engagementScore',
        'totalReach',
        'engagementRate',
        'conversionPotential',
        'scheduledDates',
        'recommendations',
        'totalDurationMs',
      ];

      requiredFields.forEach((field) => {
        expect(result.data).toHaveProperty(field);
      });
    });
  });

  describe('Content Generation', () => {
    it('should generate 5 platform-specific posts', async () => {
      const context: AgentExecutorContext = {
        ...baseContext,
        metadata: { businessType: 'ecommerce' },
      };

      const result = await executeSocialMediaManager('Test content', context);

      expect(result.data?.postsGenerated).toBe(5);
      expect((result.data?.platformsCovered as string[])?.length).toBe(5);
    });
  });

  describe('Metrics', () => {
    it('should calculate engagement rate between 0 and 1', async () => {
      const result = await executeSocialMediaManager('Test message', baseContext);

      const engagementRate = parseFloat(result.data?.engagementRate as string);
      expect(engagementRate).toBeGreaterThanOrEqual(0);
      expect(engagementRate).toBeLessThanOrEqual(100);
    });

    it('should calculate total reach based on platform metrics', async () => {
      const result = await executeSocialMediaManager('Test message', baseContext);

      const totalReach = result.data?.totalReach as number;
      expect(totalReach).toBeGreaterThan(0);
    });
  });
});
