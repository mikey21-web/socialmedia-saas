import { PlatformsService } from '../../platforms/platforms.service';
import { AnalyticsMetricRecord } from '../types';
import { asNumber, readPlatformToken } from './helpers';

export function buildCollectAnalyticsInstagramActivity(platformsService: PlatformsService) {
  return async function collectAnalyticsInstagram(input: {
    externalId: string;
    postId: string;
    userId: string;
  }): Promise<AnalyticsMetricRecord> {
    const accessToken = await readPlatformToken(platformsService, input.userId, 'instagram');
    const url = new URL(`https://graph.facebook.com/v19.0/${input.externalId}`);
    url.searchParams.set('fields', 'like_count,comments_count,impressions,reach,saved');
    url.searchParams.set('access_token', accessToken);

    const response = await fetch(url);
    const payload = (await response.json()) as Record<string, unknown>;

    const likes = asNumber(payload.like_count);
    const comments = asNumber(payload.comments_count);
    const impressions = asNumber(payload.impressions) || asNumber(payload.reach);
    const engagements = likes + comments + asNumber(payload.saved);

    return {
      platform: 'instagram',
      externalId: input.externalId,
      impressions,
      engagements,
      likes,
      comments,
    };
  };
}
