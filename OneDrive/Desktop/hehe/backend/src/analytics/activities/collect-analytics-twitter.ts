import { PlatformsService } from '../../platforms/platforms.service';
import { AnalyticsMetricRecord } from '../types';
import { asNumber, readPlatformToken } from './helpers';

export function buildCollectAnalyticsTwitterActivity(platformsService: PlatformsService) {
  return async function collectAnalyticsTwitter(input: {
    externalId: string;
    postId: string;
    userId: string;
  }): Promise<AnalyticsMetricRecord> {
    const accessToken = await readPlatformToken(platformsService, input.userId, 'twitter');
    const url = new URL(`https://api.twitter.com/2/tweets/${input.externalId}`);
    url.searchParams.set('tweet.fields', 'public_metrics');

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payload = (await response.json()) as {
      data?: { public_metrics?: Record<string, unknown> };
    };
    const metrics = payload.data?.public_metrics ?? {};

    const likes = asNumber(metrics.like_count);
    const replies = asNumber(metrics.reply_count);
    const retweets = asNumber(metrics.retweet_count);
    const impressions = asNumber(metrics.impression_count);
    const engagements = likes + replies + retweets;

    return {
      platform: 'twitter',
      externalId: input.externalId,
      impressions,
      engagements,
      likes,
      comments: replies,
    };
  };
}
