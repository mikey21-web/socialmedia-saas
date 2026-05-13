import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformsService } from '../platforms/platforms.service';
import { retryWithBackoff } from '../common/retry/retry-with-backoff';
import { classifyResponseError, PlatformError } from '../common/errors/platform-errors';

export interface PlatformPostMetrics {
  platform: string;
  reach?: number;
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  videoViews?: number;
  watchTime?: number;
}

/**
 * Fetches real post metrics from each platform's API.
 * Used by the metrics refresh cron and Temporal analytics workflows.
 *
 * Each platform method:
 * - Reads OAuth credential
 * - Calls the platform's analytics endpoint
 * - Maps the response to a normalized PlatformPostMetrics shape
 * - Retries on transient errors via retryWithBackoff
 */
@Injectable()
export class PlatformMetricsFetcher {
  private readonly logger = new Logger(PlatformMetricsFetcher.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly platformsService: PlatformsService,
  ) {}

  async fetchMetrics(
    platform: string,
    platformPostId: string,
    teamId: string,
  ): Promise<PlatformPostMetrics> {
    const userId = await this.getTeamOwnerId(teamId);
    if (!userId) {
      this.logger.warn(`No team owner for ${teamId}, skipping metrics fetch`);
      return { platform };
    }

    try {
      switch (platform) {
        case 'twitter':
        case 'x':
          return await retryWithBackoff(() => this.fetchTwitter(userId, platformPostId), { maxAttempts: 2 });
        case 'instagram':
          return await retryWithBackoff(() => this.fetchInstagram(userId, platformPostId), { maxAttempts: 2 });
        case 'linkedin':
          return await retryWithBackoff(() => this.fetchLinkedIn(userId, platformPostId), { maxAttempts: 2 });
        case 'facebook':
          return await retryWithBackoff(() => this.fetchFacebook(userId, platformPostId), { maxAttempts: 2 });
        case 'tiktok':
          return await retryWithBackoff(() => this.fetchTikTok(userId, platformPostId), { maxAttempts: 2 });
        case 'youtube':
          return await retryWithBackoff(() => this.fetchYouTube(userId, platformPostId), { maxAttempts: 2 });
        default:
          return { platform };
      }
    } catch (err) {
      if (err instanceof PlatformError) {
        this.logger.warn(`Metrics fetch failed for ${platform}/${platformPostId}: ${err.code} ${err.message}`);
      } else {
        this.logger.warn(`Metrics fetch failed for ${platform}/${platformPostId}: ${(err as Error)?.message}`);
      }
      return { platform };
    }
  }

  // ─── Twitter / X ──────────────────────────────────────────────────────────

  private async fetchTwitter(userId: string, tweetId: string): Promise<PlatformPostMetrics> {
    const token = await this.getAccessToken(userId, 'x');
    const url = new URL(`https://api.twitter.com/2/tweets/${tweetId}`);
    url.searchParams.set('tweet.fields', 'public_metrics,non_public_metrics,organic_metrics');

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw classifyResponseError('twitter', response, body);
    }

    const payload = (await response.json()) as {
      data?: {
        public_metrics?: Record<string, unknown>;
        non_public_metrics?: Record<string, unknown>;
        organic_metrics?: Record<string, unknown>;
      };
    };
    const pub = payload.data?.public_metrics ?? {};
    const np = payload.data?.non_public_metrics ?? {};
    const org = payload.data?.organic_metrics ?? {};

    return {
      platform: 'twitter',
      impressions: this.num(pub.impression_count) || this.num(np.impression_count) || this.num(org.impression_count),
      likes: this.num(pub.like_count) || this.num(org.like_count),
      comments: this.num(pub.reply_count) || this.num(org.reply_count),
      shares: this.num(pub.retweet_count) || this.num(pub.quote_count) || this.num(org.retweet_count),
      clicks: this.num(np.url_link_clicks) || this.num(org.url_link_clicks),
    };
  }

  // ─── Instagram ────────────────────────────────────────────────────────────

  private async fetchInstagram(userId: string, mediaId: string): Promise<PlatformPostMetrics> {
    const token = await this.getAccessToken(userId, 'instagram');
    const url = new URL(`https://graph.instagram.com/v18.0/${mediaId}/insights`);
    url.searchParams.set(
      'metric',
      'impressions,reach,likes,comments,shares,saved,profile_visits,total_interactions',
    );
    url.searchParams.set('access_token', token);

    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw classifyResponseError('instagram', response, body);
    }

    const payload = (await response.json()) as {
      data?: Array<{ name: string; values?: Array<{ value: unknown }> }>;
    };
    const metrics: Record<string, number> = {};
    for (const item of payload.data ?? []) {
      const value = this.num(item.values?.[0]?.value);
      metrics[item.name] = value;
    }

    return {
      platform: 'instagram',
      impressions: metrics.impressions,
      reach: metrics.reach,
      likes: metrics.likes,
      comments: metrics.comments,
      shares: metrics.shares,
      saves: metrics.saved,
    };
  }

  // ─── LinkedIn ─────────────────────────────────────────────────────────────

  private async fetchLinkedIn(userId: string, urn: string): Promise<PlatformPostMetrics> {
    const token = await this.getAccessToken(userId, 'linkedin');
    const encodedUrn = encodeURIComponent(urn);
    const url = `https://api.linkedin.com/rest/socialActions/${encodedUrn}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'LinkedIn-Version': '202601',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw classifyResponseError('linkedin', response, body);
    }

    const payload = (await response.json()) as {
      likesSummary?: { totalLikes?: number };
      commentsSummary?: { totalComments?: number };
    };

    return {
      platform: 'linkedin',
      likes: this.num(payload.likesSummary?.totalLikes),
      comments: this.num(payload.commentsSummary?.totalComments),
    };
  }

  // ─── Facebook ─────────────────────────────────────────────────────────────

  private async fetchFacebook(userId: string, postId: string): Promise<PlatformPostMetrics> {
    const token = await this.getAccessToken(userId, 'facebook');
    const url = new URL(`https://graph.facebook.com/v19.0/${postId}/insights`);
    url.searchParams.set(
      'metric',
      'post_impressions,post_impressions_unique,post_engaged_users,post_clicks,post_reactions_by_type_total',
    );
    url.searchParams.set('access_token', token);

    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw classifyResponseError('facebook', response, body);
    }

    const payload = (await response.json()) as {
      data?: Array<{ name: string; values?: Array<{ value: unknown }> }>;
    };
    const map: Record<string, unknown> = {};
    for (const item of payload.data ?? []) {
      map[item.name] = item.values?.[0]?.value;
    }

    const reactions = map.post_reactions_by_type_total as Record<string, number> | undefined;
    const totalReactions = reactions
      ? Object.values(reactions).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0)
      : 0;

    return {
      platform: 'facebook',
      impressions: this.num(map.post_impressions),
      reach: this.num(map.post_impressions_unique),
      likes: totalReactions,
      clicks: this.num(map.post_clicks),
    };
  }

  // ─── TikTok ───────────────────────────────────────────────────────────────

  private async fetchTikTok(userId: string, videoId: string): Promise<PlatformPostMetrics> {
    const token = await this.getAccessToken(userId, 'tiktok');
    const response = await fetch(
      'https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,comment_count,share_count',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters: { video_ids: [videoId] } }),
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw classifyResponseError('tiktok', response, body);
    }

    const payload = (await response.json()) as {
      data?: { videos?: Array<Record<string, unknown>> };
    };
    const video = payload.data?.videos?.[0] ?? {};

    return {
      platform: 'tiktok',
      videoViews: this.num(video.view_count),
      impressions: this.num(video.view_count),
      likes: this.num(video.like_count),
      comments: this.num(video.comment_count),
      shares: this.num(video.share_count),
    };
  }

  // ─── YouTube ──────────────────────────────────────────────────────────────

  private async fetchYouTube(userId: string, videoId: string): Promise<PlatformPostMetrics> {
    const token = await this.getAccessToken(userId, 'youtube');
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('id', videoId);
    url.searchParams.set('part', 'statistics');

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw classifyResponseError('youtube', response, body);
    }

    const payload = (await response.json()) as {
      items?: Array<{ statistics?: Record<string, string> }>;
    };
    const stats = payload.items?.[0]?.statistics ?? {};

    return {
      platform: 'youtube',
      videoViews: this.num(stats.viewCount),
      impressions: this.num(stats.viewCount),
      likes: this.num(stats.likeCount),
      comments: this.num(stats.commentCount),
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async getAccessToken(userId: string, platform: string): Promise<string> {
    const credentials = await this.platformsService.getCredentialsByPlatform(userId, platform);
    if (!credentials.length) {
      throw new PlatformError(platform, 'No credential found', 'NO_CREDENTIAL', false);
    }
    return credentials[0].accessToken;
  }

  private async getTeamOwnerId(teamId: string): Promise<string | null> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true },
    });
    return team?.ownerId ?? null;
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
