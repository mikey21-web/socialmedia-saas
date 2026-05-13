import { LearningLoopService } from './learning-loop.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  team: { findMany: jest.fn() },
  post: { findMany: jest.fn() },
  performanceInsight: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
};

describe('LearningLoopService', () => {
  let service: LearningLoopService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LearningLoopService(mockPrisma as unknown as PrismaService);
  });

  describe('analyzeTeamPatterns', () => {
    it('returns early when fewer than 10 posts', async () => {
      mockPrisma.post.findMany.mockResolvedValue([
        { id: 'p1', content: 'test', mediaUrls: [], analytics: [], platforms: [], scheduledAt: new Date() },
      ]);

      const result = await service.analyzeTeamPatterns('team1');
      expect(result.message).toContain('Not enough data');
    });

    it('detects question hooks pattern', async () => {
      const posts = Array.from({ length: 12 }, (_, i) => ({
        id: `p${i}`,
        content: i < 6 ? `Did you know that ${i}?` : `Statement number ${i}`,
        mediaUrls: [],
        scheduledAt: new Date(`2026-05-${String(i + 1).padStart(2, '0')}T09:00:00Z`),
        analytics: [
          { eventType: 'engagement', count: i < 6 ? 100 : 30 },
        ],
        platforms: [{ platform: 'twitter' }],
      }));

      mockPrisma.post.findMany.mockResolvedValue(posts);
      mockPrisma.performanceInsight.upsert.mockResolvedValue({});

      const result = await service.analyzeTeamPatterns('team1');

      expect(mockPrisma.performanceInsight.upsert).toHaveBeenCalled();
      expect(result.postsAnalyzed).toBe(12);

      // Look for the question pattern call
      const calls = mockPrisma.performanceInsight.upsert.mock.calls;
      const questionCall = calls.find(([arg]) => arg.where.teamId_insightType_pattern.pattern === 'question');
      expect(questionCall).toBeDefined();
    });
  });

  describe('getInsightsForGeneration', () => {
    it('returns only high-confidence positive insights', async () => {
      mockPrisma.performanceInsight.findMany.mockResolvedValue([
        { insightType: 'hook_type', pattern: 'question', multiplier: 2.0, confidence: 0.8 },
        { insightType: 'posting_time', pattern: 'hour_9', multiplier: 1.5, confidence: 0.6 },
      ]);

      const insights = await service.getInsightsForGeneration('team1');
      expect(insights).toHaveLength(2);
      expect(insights[0]).toContain('question');
    });

    it('filters insights by confidence threshold', async () => {
      mockPrisma.performanceInsight.findMany.mockResolvedValue([]);

      await service.getInsightsForGeneration('team1');

      expect(mockPrisma.performanceInsight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            confidence: { gte: 0.4 },
            multiplier: { gte: 1.3 },
          }),
        }),
      );
    });
  });
});
