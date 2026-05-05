import { PlatformsService } from '../../platforms/platforms.service';
import { AnalyticsMetricRecord } from '../types';
import { asNumber, readPlatformToken } from './helpers';

export function buildCollectAnalyticsLinkedInActivity(platformsService: PlatformsService) {
  return async function collectAnalyticsLinkedIn(input: {
    externalId: string;
    postId: string;
    userId: string;
  }): Promise<AnalyticsMetricRecord> {
    const accessToken = await readPlatformToken(platformsService, input.userId, 'linkedin');
    const url = new URL(`https://api.linkedin.com/v2/socialActions/${encodeURIComponent(input.externalId)}`);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payload = (await response.json()) as Record<string, unknown>;

    const likes = asNumber((payload.likesSummary as Record<string, unknown> | undefined)?.totalLikes);
    const comments = asNumber((payload.commentsSummary as Record<string, unknown> | undefined)?.totalFirstLevelComments);
    const engagements = likes + comments;

    return {
      platform: 'linkedin',
      externalId: input.externalId,
      engagements,
      likes,
      comments,
      impressions: asNumber(payload.impressionCount),
    };
  };
}
