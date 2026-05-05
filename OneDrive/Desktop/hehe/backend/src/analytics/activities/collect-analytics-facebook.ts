import { PlatformsService } from '../../platforms/platforms.service';
import { AnalyticsMetricRecord } from '../types';
import { asNumber, readPlatformToken } from './helpers';

export function buildCollectAnalyticsFacebookActivity(platformsService: PlatformsService) {
  return async function collectAnalyticsFacebook(input: {
    externalId: string;
    postId: string;
    userId: string;
  }): Promise<AnalyticsMetricRecord> {
    const accessToken = await readPlatformToken(platformsService, input.userId, 'facebook');
    const url = new URL(`https://graph.facebook.com/v19.0/${input.externalId}`);
    url.searchParams.set(
      'fields',
      'likes.summary(total_count).limit(0),comments.summary(total_count).limit(0),insights.metric(post_impressions)',
    );
    url.searchParams.set('access_token', accessToken);

    const response = await fetch(url);
    const payload = (await response.json()) as Record<string, unknown>;

    const likes = asNumber(
      (((payload.likes as Record<string, unknown> | undefined)?.summary as Record<string, unknown> | undefined)?.total_count),
    );
    const comments = asNumber(
      (((payload.comments as Record<string, unknown> | undefined)?.summary as Record<string, unknown> | undefined)?.total_count),
    );
    const impressions = asNumber(
      ((((payload.insights as Record<string, unknown> | undefined)?.data as unknown[] | undefined)?.[0] as Record<string, unknown> | undefined)?.values as Record<string, unknown>[] | undefined)?.[0]?.value,
    );

    return {
      platform: 'facebook',
      externalId: input.externalId,
      impressions,
      engagements: likes + comments,
      likes,
      comments,
    };
  };
}
