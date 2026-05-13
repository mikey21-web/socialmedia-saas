import { RoiService } from './roi.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  utmLink: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  conversionEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  post: {
    findMany: jest.fn(),
  },
};

describe('RoiService', () => {
  let service: RoiService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BACKEND_URL = 'http://localhost:3001';
    service = new RoiService(mockPrisma as unknown as PrismaService);
  });

  describe('createUtmLink', () => {
    it('creates UTM link with platform-specific source', async () => {
      mockPrisma.utmLink.create.mockResolvedValue({
        id: 'link1',
        shortUrl: 'http://localhost:3001/r/abc123',
      });

      const result = await service.createUtmLink('team1', {
        platform: 'instagram',
        destinationUrl: 'https://example.com/product',
        utmCampaign: 'summer_sale',
      });

      expect(mockPrisma.utmLink.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            teamId: 'team1',
            platform: 'instagram',
            utmSource: 'instagram',
            utmCampaign: 'summer_sale',
          }),
        }),
      );
      expect(result.fullUrl).toContain('utm_source=instagram');
      expect(result.fullUrl).toContain('utm_campaign=summer_sale');
    });
  });

  describe('createUtmLinksForPost', () => {
    it('creates one link per platform', async () => {
      mockPrisma.utmLink.create.mockResolvedValue({ id: 'link', shortUrl: 'short' });

      const links = await service.createUtmLinksForPost(
        'team1',
        'post1',
        'https://example.com',
        ['twitter', 'linkedin', 'instagram'],
      );

      expect(links).toHaveLength(3);
      expect(mockPrisma.utmLink.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('recordConversion', () => {
    it('increments conversions and revenue on UTM link', async () => {
      mockPrisma.conversionEvent.create.mockResolvedValue({ id: 'conv1' });
      mockPrisma.utmLink.update.mockResolvedValue({});

      await service.recordConversion('team1', {
        utmLinkId: 'link1',
        eventType: 'purchase',
        value: 999,
      });

      expect(mockPrisma.utmLink.update).toHaveBeenCalledWith({
        where: { id: 'link1' },
        data: {
          conversions: { increment: 1 },
          revenue: { increment: 999 },
        },
      });
    });

    it('does not increment for click events', async () => {
      mockPrisma.conversionEvent.create.mockResolvedValue({ id: 'conv1' });

      await service.recordConversion('team1', {
        utmLinkId: 'link1',
        eventType: 'click',
      });

      expect(mockPrisma.utmLink.update).not.toHaveBeenCalled();
    });
  });

  describe('getRoiSummary', () => {
    it('aggregates clicks, conversions, and revenue', async () => {
      mockPrisma.utmLink.findMany.mockResolvedValue([
        { postId: 'p1', platform: 'twitter', clicks: 100, conversions: 10, revenue: 5000 },
        { postId: 'p1', platform: 'linkedin', clicks: 50, conversions: 5, revenue: 2500 },
        { postId: 'p2', platform: 'twitter', clicks: 30, conversions: 1, revenue: 100 },
      ]);
      mockPrisma.post.findMany.mockResolvedValue([
        { id: 'p1', title: 'Top post' },
        { id: 'p2', title: 'Other post' },
      ]);

      const summary = await service.getRoiSummary('team1');

      expect(summary.totalClicks).toBe(180);
      expect(summary.totalConversions).toBe(16);
      expect(summary.totalRevenue).toBe(7600);
      expect(summary.conversionRate).toBeCloseTo((16 / 180) * 100);
      expect(summary.topPerformingPosts[0].postId).toBe('p1');
      expect(summary.topPerformingPosts[0].revenue).toBe(7500);
      expect(summary.byPlatform).toHaveLength(2);
    });

    it('handles empty data', async () => {
      mockPrisma.utmLink.findMany.mockResolvedValue([]);

      const summary = await service.getRoiSummary('team1');

      expect(summary.totalClicks).toBe(0);
      expect(summary.totalConversions).toBe(0);
      expect(summary.conversionRate).toBe(0);
    });
  });
});
