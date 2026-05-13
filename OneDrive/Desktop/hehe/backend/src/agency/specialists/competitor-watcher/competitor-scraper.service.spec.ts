import { CompetitorScraperService } from './competitor-scraper.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformsService } from '../../../platforms/platforms.service';

describe('CompetitorScraperService', () => {
  const mockPrisma = {
    competitorTrack: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    competitorPost: { upsert: jest.fn() },
    team: { findUnique: jest.fn() },
  };

  const mockPlatforms = {
    getCredentialsByPlatform: jest.fn(),
  };

  let service: CompetitorScraperService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CompetitorScraperService(
      mockPrisma as unknown as PrismaService,
      mockPlatforms as unknown as PlatformsService,
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('scrapeCompetitor', () => {
    it('throws when track not found', async () => {
      mockPrisma.competitorTrack.findFirst.mockResolvedValue(null);
      await expect(service.scrapeCompetitor('team1', 'track1')).rejects.toThrow('Competitor track not found');
    });

    it('returns empty array when team has no credentials', async () => {
      mockPrisma.competitorTrack.findFirst.mockResolvedValue({
        id: 'track1',
        platform: 'twitter',
        handle: '@competitor',
        teamId: 'team1',
      });
      mockPrisma.team.findUnique.mockResolvedValue({ ownerId: 'user1' });
      mockPlatforms.getCredentialsByPlatform.mockResolvedValue([]);
      mockPrisma.competitorTrack.update.mockResolvedValue({});

      const result = await service.scrapeCompetitor('team1', 'track1');
      expect(result).toEqual([]);
    });

    it('scrapes Twitter posts and upserts them', async () => {
      mockPrisma.competitorTrack.findFirst.mockResolvedValue({
        id: 'track1',
        platform: 'twitter',
        handle: '@competitor',
        teamId: 'team1',
      });
      mockPrisma.team.findUnique.mockResolvedValue({ ownerId: 'user1' });
      mockPlatforms.getCredentialsByPlatform.mockResolvedValue([{ accessToken: 'tok' }]);
      mockPrisma.competitorTrack.update.mockResolvedValue({});

      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 'twitter-user-1' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{
              id: 'tweet1',
              text: 'Test tweet #ai',
              created_at: '2026-01-01T00:00:00Z',
              public_metrics: { like_count: 10, reply_count: 2, retweet_count: 1 },
              entities: { hashtags: [{ tag: 'ai' }] },
            }],
          }),
        }) as any;

      mockPrisma.competitorPost.upsert.mockResolvedValue({ id: 'cp1' });

      const result = await service.scrapeCompetitor('team1', 'track1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.competitorPost.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            externalId: 'tweet1',
            likes: 10,
            comments: 2,
            shares: 1,
            hashtags: ['ai'],
          }),
        }),
      );
    });
  });
});
