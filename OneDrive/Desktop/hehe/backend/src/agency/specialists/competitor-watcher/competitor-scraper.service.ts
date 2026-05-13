import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformsService } from '../../../platforms/platforms.service';
import { retryWithBackoff } from '../../../common/retry/retry-with-backoff';
import { classifyResponseError, PlatformError } from '../../../common/errors/platform-errors';

interface ScrapedPost {
  externalId: string;
  url: string;
  caption: string;
  mediaUrls: string[];
  likes: number;
  comments: number;
  shares: number;
  hashtags: string[];
  postType: string;
  postedAt: Date;
}

/**
 * Scrapes competitor posts from each platform's public API.
 * Stores results in CompetitorPost so the rest of the agency stack
 * (counter-posts, digest, content recommendations) can use them.
 */
@Injectable()
export class CompetitorScraperService {
  private readonly logger = new Logger(CompetitorScraperService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly platformsService: PlatformsService,
  ) {}

  /**
   * Run every 4 hours, scrape each active competitor for that team.
   */
  @Cron('0 */4 * * *')
  async scheduledScrape() {
    const tracks = await this.prisma.competitorTrack.findMany({
      where: { isActive: true },
    });

    let scraped = 0;
    let failed = 0;

    for (const track of tracks) {
      try {
        const posts = await this.scrapeCompetitor(track.teamId, track.id);
        scraped += posts.length;
      } catch (err) {
        failed++;
        this.logger.warn(`Scrape failed for ${track.platform}/${track.handle}: ${(err as Error)?.message}`);
      }
    }

    this.logger.log(`Competitor scrape cycle: ${scraped} new posts, ${failed} tracks failed`);
  }

  async scrapeCompetitor(teamId: string, trackId: string) {
    const track = await this.prisma.competitorTrack.findFirst({
      where: { id: trackId, teamId },
    });

    if (!track) {
      throw new Error('Competitor track not found');
    }

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    const posts = await this.fetchPostsForPlatform(team.ownerId, track.platform, track.handle);

    const created = await Promise.all(
      posts.map(async (post) => {
        try {
          return await this.prisma.competitorPost.upsert({
            where: {
              competitorId_externalId: {
                competitorId: track.id,
                externalId: post.externalId,
              },
            },
            create: {
              competitorId: track.id,
              platform: track.platform,
              externalId: post.externalId,
              url: post.url,
              caption: post.caption,
              mediaUrls: post.mediaUrls,
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
              engagementRate: this.calculateEngagementRate(post),
              hashtags: post.hashtags,
              postType: post.postType,
              postedAt: post.postedAt,
            },
            update: {
              caption: post.caption,
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
              engagementRate: this.calculateEngagementRate(post),
            },
          });
        } catch (err) {
          this.logger.warn(`Failed to upsert competitor post ${post.externalId}: ${(err as Error)?.message}`);
          return null;
        }
      }),
    );

    await this.prisma.competitorTrack.update({
      where: { id: trackId },
      data: {
        lastScannedAt: new Date(),
        metricsSnapshot: {
          totalPostsScraped: posts.length,
          lastRun: new Date().toISOString(),
        },
      },
    });

    return created.filter((p): p is NonNullable<typeof p> => p !== null);
  }

  private async fetchPostsForPlatform(
    userId: string,
    platform: string,
    handle: string,
  ): Promise<ScrapedPost[]> {
    try {
      switch (platform) {
        case 'twitter':
        case 'x':
          return await retryWithBackoff(() => this.fetchTwitterPosts(userId, handle), { maxAttempts: 2 });
        case 'instagram':
          return await retryWithBackoff(() => this.fetchInstagramPosts(userId, handle), { maxAttempts: 2 });
        case 'tiktok':
          return await retryWithBackoff(() => this.fetchTikTokPosts(userId, handle), { maxAttempts: 2 });
        case 'youtube':
          return await retryWithBackoff(() => this.fetchYouTubePosts(userId, handle), { maxAttempts: 2 });
        default:
          return [];
      }
    } catch (err) {
      if (err instanceof PlatformError) {
        this.logger.warn(`Competitor fetch ${platform}/${handle}: ${err.code}`);
      }
      return [];
    }
  }

  // ─── Twitter ──────────────────────────────────────────────────────────────

  private async fetchTwitterPosts(userId: string, handle: string): Promise<ScrapedPost[]> {
    const credentials = await this.platformsService.getCredentialsByPlatform(userId, 'x');
    if (!credentials.length) return [];
    const token = credentials[0].accessToken;
    const cleanHandle = handle.replace(/^@/, '');

    // Look up user id
    const userResp = await fetch(`https://api.twitter.com/2/users/by/username/${cleanHandle}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!userResp.ok) {
      const body = await userResp.json().catch(() => ({}));
      throw classifyResponseError('twitter', userResp, body);
    }
    const userPayload = (await userResp.json()) as { data?: { id?: string } };
    const userTwitterId = userPayload.data?.id;
    if (!userTwitterId) return [];

    // Fetch recent tweets
    const tweetsUrl = new URL(`https://api.twitter.com/2/users/${userTwitterId}/tweets`);
    tweetsUrl.searchParams.set('max_results', '20');
    tweetsUrl.searchParams.set('tweet.fields', 'created_at,public_metrics,entities,attachments');

    const tweetsResp = await fetch(tweetsUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!tweetsResp.ok) {
      const body = await tweetsResp.json().catch(() => ({}));
      throw classifyResponseError('twitter', tweetsResp, body);
    }

    const payload = (await tweetsResp.json()) as {
      data?: Array<{
        id: string;
        text: string;
        created_at?: string;
        public_metrics?: Record<string, unknown>;
        entities?: { hashtags?: Array<{ tag: string }> };
      }>;
    };

    return (payload.data ?? []).map((tweet) => {
      const m = tweet.public_metrics ?? {};
      return {
        externalId: tweet.id,
        url: `https://twitter.com/${cleanHandle}/status/${tweet.id}`,
        caption: tweet.text,
        mediaUrls: [],
        likes: this.num(m.like_count),
        comments: this.num(m.reply_count),
        shares: this.num(m.retweet_count),
        hashtags: (tweet.entities?.hashtags ?? []).map((h) => h.tag),
        postType: 'tweet',
        postedAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
      };
    });
  }

  // ─── Instagram (Business Discovery) ───────────────────────────────────────

  private async fetchInstagramPosts(userId: string, handle: string): Promise<ScrapedPost[]> {
    const credentials = await this.platformsService.getCredentialsByPlatform(userId, 'instagram');
    if (!credentials.length) return [];
    const token = credentials[0].accessToken;
    const myAccountId = credentials[0].accountId;
    if (!myAccountId) return [];

    const cleanHandle = handle.replace(/^@/, '');
    const url = new URL(`https://graph.instagram.com/v18.0/${myAccountId}`);
    url.searchParams.set(
      'fields',
      `business_discovery.username(${cleanHandle}){media{id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count}}`,
    );
    url.searchParams.set('access_token', token);

    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw classifyResponseError('instagram', response, body);
    }

    const payload = (await response.json()) as {
      business_discovery?: {
        media?: {
          data?: Array<{
            id: string;
            caption?: string;
            media_type?: string;
            media_url?: string;
            permalink?: string;
            timestamp?: string;
            like_count?: number;
            comments_count?: number;
          }>;
        };
      };
    };

    const items = payload.business_discovery?.media?.data ?? [];
    return items.map((item) => ({
      externalId: item.id,
      url: item.permalink ?? '',
      caption: item.caption ?? '',
      mediaUrls: item.media_url ? [item.media_url] : [],
      likes: this.num(item.like_count),
      comments: this.num(item.comments_count),
      shares: 0,
      hashtags: this.extractHashtags(item.caption ?? ''),
      postType: (item.media_type ?? 'image').toLowerCase(),
      postedAt: item.timestamp ? new Date(item.timestamp) : new Date(),
    }));
  }

  // ─── TikTok ───────────────────────────────────────────────────────────────

  private async fetchTikTokPosts(userId: string, handle: string): Promise<ScrapedPost[]> {
    // TikTok's research API is approval-only. For self-tracked handles,
    // we use the user info endpoint. Public competitor scraping requires
    // research access; we return empty rather than fail loudly.
    const credentials = await this.platformsService.getCredentialsByPlatform(userId, 'tiktok');
    if (!credentials.length) return [];

    const cleanHandle = handle.replace(/^@/, '');
    const ownHandle = credentials[0].accountName?.replace(/^@/, '');

    if (cleanHandle !== ownHandle) {
      this.logger.warn(`TikTok competitor scraping requires Research API approval; skipping ${handle}`);
      return [];
    }

    const token = credentials[0].accessToken;
    const response = await fetch(
      'https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time,like_count,comment_count,share_count,view_count,video_description,share_url',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ max_count: 20 }),
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw classifyResponseError('tiktok', response, body);
    }

    const payload = (await response.json()) as {
      data?: {
        videos?: Array<{
          id: string;
          title?: string;
          create_time?: number;
          like_count?: number;
          comment_count?: number;
          share_count?: number;
          view_count?: number;
          video_description?: string;
          share_url?: string;
        }>;
      };
    };

    return (payload.data?.videos ?? []).map((v) => ({
      externalId: v.id,
      url: v.share_url ?? '',
      caption: v.video_description ?? v.title ?? '',
      mediaUrls: [],
      likes: this.num(v.like_count),
      comments: this.num(v.comment_count),
      shares: this.num(v.share_count),
      hashtags: this.extractHashtags(v.video_description ?? ''),
      postType: 'video',
      postedAt: v.create_time ? new Date(v.create_time * 1000) : new Date(),
    }));
  }

  // ─── YouTube (public channel) ─────────────────────────────────────────────

  private async fetchYouTubePosts(userId: string, handle: string): Promise<ScrapedPost[]> {
    const credentials = await this.platformsService.getCredentialsByPlatform(userId, 'youtube');
    if (!credentials.length) return [];
    const token = credentials[0].accessToken;

    const cleanHandle = handle.startsWith('UC') ? handle : handle.replace(/^@/, '');

    // Resolve handle/username to channelId
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('q', cleanHandle);
    searchUrl.searchParams.set('type', 'channel');
    searchUrl.searchParams.set('part', 'id');
    searchUrl.searchParams.set('maxResults', '1');

    const searchResp = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!searchResp.ok) {
      const body = await searchResp.json().catch(() => ({}));
      throw classifyResponseError('youtube', searchResp, body);
    }
    const searchPayload = (await searchResp.json()) as {
      items?: Array<{ id?: { channelId?: string } }>;
    };
    const channelId = searchPayload.items?.[0]?.id?.channelId;
    if (!channelId) return [];

    // Fetch latest videos
    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    videosUrl.searchParams.set('channelId', channelId);
    videosUrl.searchParams.set('part', 'snippet');
    videosUrl.searchParams.set('order', 'date');
    videosUrl.searchParams.set('maxResults', '10');
    videosUrl.searchParams.set('type', 'video');

    const vResp = await fetch(videosUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!vResp.ok) {
      const body = await vResp.json().catch(() => ({}));
      throw classifyResponseError('youtube', vResp, body);
    }
    const vPayload = (await vResp.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: { title?: string; description?: string; publishedAt?: string };
      }>;
    };

    return (vPayload.items ?? []).flatMap((item) => {
      const vid = item.id?.videoId;
      if (!vid) return [];
      return [{
        externalId: vid,
        url: `https://youtube.com/watch?v=${vid}`,
        caption: `${item.snippet?.title ?? ''}\n\n${item.snippet?.description ?? ''}`,
        mediaUrls: [],
        likes: 0,
        comments: 0,
        shares: 0,
        hashtags: this.extractHashtags(item.snippet?.description ?? ''),
        postType: 'video',
        postedAt: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : new Date(),
      }];
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private extractHashtags(text: string): string[] {
    const matches = text.match(/#[\w\u00C0-\u024F\u0400-\u04FF]+/g) ?? [];
    return matches.map((tag) => tag.slice(1).toLowerCase());
  }

  private calculateEngagementRate(post: ScrapedPost): number {
    const total = post.likes + post.comments + post.shares;
    if (total === 0) return 0;
    return total;
  }

  private num(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }
}
