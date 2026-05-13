import { PlatformMetricsFetcher } from './platform-metrics-fetcher.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformsService } from '../platforms/platforms.service';

describe('PlatformMetricsFetcher', () => {
  const mockPrisma = {
    team: { findUnique: jest.fn() },
  };

  const mockPlatforms = {
    getCredentialsByPlatform: jest.fn(),
  };

  let fetcher: PlatformMetricsFetcher;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    fetcher = new PlatformMetricsFetcher(
      mockPrisma as unknown as PrismaService,
      mockPlatforms as unknown as PlatformsService,
    );
    mockPrisma.team.findUnique.mockResolvedValue({ ownerId: 'user-1' });
    mockPlatforms.getCredentialsByPlatform.mockResolvedValue([{ accessToken: 'tok' }]);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns empty when team owner is missing', async () => {
    mockPrisma.team.findUnique.mockResolvedValue(null);
    const result = await fetcher.fetchMetrics('twitter', 'tweet1', 'team1');
    expect(result.platform).toBe('twitter');
    expect(result.likes).toBeUndefined();
  });

  it('parses Twitter public_metrics', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          public_metrics: {
            impression_count: 1000,
            like_count: 50,
            reply_count: 10,
            retweet_count: 5,
          },
        },
      }),
    }) as any;

    const result = await fetcher.fetchMetrics('twitter', 'tweet1', 'team1');
    expect(result.impressions).toBe(1000);
    expect(result.likes).toBe(50);
    expect(result.comments).toBe(10);
    expect(result.shares).toBe(5);
  });

  it('returns empty platform on auth failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: { get: () => null },
      json: async () => ({ error: 'Invalid token' }),
    }) as any;

    const result = await fetcher.fetchMetrics('twitter', 'tweet1', 'team1');
    expect(result.platform).toBe('twitter');
    expect(result.likes).toBeUndefined();
  });

  it('parses TikTok video metrics', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          videos: [{
            view_count: 5000,
            like_count: 200,
            comment_count: 30,
            share_count: 15,
          }],
        },
      }),
    }) as any;

    const result = await fetcher.fetchMetrics('tiktok', 'vid1', 'team1');
    expect(result.videoViews).toBe(5000);
    expect(result.likes).toBe(200);
  });

  it('parses YouTube statistics', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{
          statistics: {
            viewCount: '10000',
            likeCount: '500',
            commentCount: '40',
          },
        }],
      }),
    }) as any;

    const result = await fetcher.fetchMetrics('youtube', 'video1', 'team1');
    expect(result.videoViews).toBe(10000);
    expect(result.likes).toBe(500);
    expect(result.comments).toBe(40);
  });

  it('returns empty for unknown platforms', async () => {
    const result = await fetcher.fetchMetrics('unknown_platform', 'id', 'team1');
    expect(result.platform).toBe('unknown_platform');
  });
});
