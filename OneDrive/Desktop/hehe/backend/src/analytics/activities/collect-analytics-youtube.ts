import { google } from 'googleapis';
import { PlatformsService } from '../../platforms/platforms.service';
import { AnalyticsMetricRecord } from '../types';
import { asNumber } from './helpers';

export function buildCollectAnalyticsYouTubeActivity(platformsService: PlatformsService) {
  return async function collectAnalyticsYouTube(input: {
    externalId: string;
    postId: string;
    userId: string;
  }): Promise<AnalyticsMetricRecord> {
    const credential = await platformsService.getCredential(input.userId, 'youtube');
    const auth = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
    );
    auth.setCredentials({
      access_token: credential.accessToken,
      refresh_token: credential.refreshToken ?? undefined,
    });
    const youtube = google.youtube({ version: 'v3', auth });

    const response = await youtube.videos.list({
      part: ['statistics'],
      id: [input.externalId],
    });

    const stats = response.data.items?.[0]?.statistics ?? {};
    const views = asNumber(stats.viewCount);
    const likes = asNumber(stats.likeCount);
    const comments = asNumber(stats.commentCount);

    return {
      platform: 'youtube',
      externalId: input.externalId,
      impressions: views,
      engagements: likes + comments,
      likes,
      comments,
    };
  };
}
