import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';

const mockPrisma = {
  post: {
    findMany: jest.fn(),
  },
  analyticsEvent: {
    findMany: jest.fn(),
  },
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsService(mockPrisma as unknown as PrismaService);
  });

  it('returns team analytics contract for dashboard consumers', async () => {
    mockPrisma.post.findMany.mockResolvedValue([
      { id: 'post-1', content: 'First', createdAt: new Date('2026-01-01T00:00:00.000Z') },
      { id: 'post-2', content: 'Second', createdAt: new Date('2026-01-02T00:00:00.000Z') },
    ]);
    mockPrisma.analyticsEvent.findMany.mockResolvedValue([
      {
        postId: 'post-1',
        eventType: 'twitter:impressions',
        count: 100,
        collectedAt: new Date('2026-01-03T10:00:00.000Z'),
      },
      {
        postId: 'post-1',
        eventType: 'twitter:engagements',
        count: 10,
        collectedAt: new Date('2026-01-03T10:00:00.000Z'),
      },
      {
        postId: 'post-2',
        eventType: 'instagram:likes',
        count: 7,
        collectedAt: new Date('2026-01-04T10:00:00.000Z'),
      },
    ]);

    const result = await service.getTeamStats('team-1');

    expect(result.metrics).toEqual(expect.arrayContaining([
      { metric: 'impressions', value: 100 },
      { metric: 'engagements', value: 10 },
      { metric: 'likes', value: 7 },
    ]));
    expect(result.chartData).toEqual([
      expect.objectContaining({ date: '2026-01-03', impressions: 100, engagements: 10 }),
      expect.objectContaining({ date: '2026-01-04', likes: 7 }),
    ]);
    expect(result.platformStats).toEqual([
      expect.objectContaining({ platform: 'instagram', likes: 7 }),
      expect.objectContaining({ platform: 'twitter', impressions: 100, engagements: 10 }),
    ]);
    expect(result.topPosts[0]).toEqual(expect.objectContaining({
      postId: 'post-1',
      engagements: 10,
    }));
  });

  it('returns smart suggestions using last 30 days post patterns', async () => {
    mockPrisma.post.findMany.mockResolvedValue([
      {
        id: 'post-a',
        scheduledAt: new Date('2026-01-03T09:00:00.000Z'),
        platforms: [{ platform: 'linkedin' }],
        analytics: [{ eventType: 'linkedin:engagements', count: 20 }],
      },
      {
        id: 'post-b',
        scheduledAt: new Date('2026-01-03T13:00:00.000Z'),
        platforms: [{ platform: 'twitter' }],
        analytics: [{ eventType: 'twitter:likes', count: 12 }],
      },
    ]);

    const result = await service.getSmartSuggestions('team-1');

    expect(result.bestTimes.length).toBeGreaterThan(0);
    expect(result.topPlatforms).toEqual(expect.arrayContaining(['linkedin', 'twitter']));
    expect(result.contentTips.length).toBeGreaterThan(0);
    expect(typeof result.weeklyInsight).toBe('string');
  });
});
