import { PlatformsService } from '../../platforms/platforms.service';
import { AnalyticsMetricRecord } from '../types';
import { asNumber, readPlatformToken } from './helpers';

type TikTokVideoQueryResponse = {
  data?: {
    videos?: Array<{
      id?: string;
      view_count?: number | string;
      like_count?: number | string;
      comment_count?: number | string;
      share_count?: number | string;
    }>;
  };
};

export function buildCollectAnalyticsTikTokActivity(platformsService: PlatformsService) {
  return async function collectAnalyticsTikTok(input: {
    externalId: string;
    postId: string;
    userId: string;
  }): Promise<AnalyticsMetricRecord> {
    const accessToken = await readPlatformToken(platformsService, input.userId, 'tiktok');
    const url = new URL('https://open.tiktokapis.com/v2/video/query/');
    url.searchParams.set('fields', 'id,view_count,like_count,comment_count,share_count');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filters: {
          video_ids: [input.externalId],
        },
      }),
    });

    const payload = (await response.json()) as TikTokVideoQueryResponse;
    const video = payload.data?.videos?.[0];

    const impressions = asNumber(video?.view_count);
    const likes = asNumber(video?.like_count);
    const comments = asNumber(video?.comment_count);
    const shares = asNumber(video?.share_count);

    return {
      platform: 'tiktok',
      externalId: input.externalId,
      impressions,
      engagements: likes + comments + shares,
      likes,
      comments,
      shares,
    };
  };
}
