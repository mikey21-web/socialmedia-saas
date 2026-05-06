import { ApplicationFailure } from '@temporalio/activity';
import { PlatformsService } from '../../platforms/platforms.service';
import { PublishActivityInput, PublishActivityResult } from '../types';
import { getAccessToken, toErrorMessage } from './helpers';

type TikTokCreatorInfoResponse = {
  data?: {
    privacy_level_options?: string[];
  };
  error?: {
    code?: string;
    message?: string;
  };
};

type TikTokPublishResponse = {
  data?: {
    publish_id?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
};

type TikTokPublishStatusResponse = {
  data?: {
    publicaly_available_post_id?: string[];
  };
  error?: {
    code?: string;
    message?: string;
  };
};

export function buildPublishTikTokActivity(platformsService: PlatformsService) {
  return async function publishTikTok(
    input: PublishActivityInput,
  ): Promise<PublishActivityResult> {
    try {
      const videoUrl = input.mediaUrls?.[0];
      if (!videoUrl || !/\.(mp4|mov|avi|mkv|webm)(\?|$)/i.test(videoUrl)) {
        throw ApplicationFailure.nonRetryable(
          'TikTok requires a video URL in mediaUrls[0]',
          'ValidationError',
        );
      }

      const accessToken = await getAccessToken(
        platformsService,
        input.userId,
        'tiktok',
        input.platformCredentialId,
      );

      const creatorInfoResponse = await fetch(
        'https://open.tiktokapis.com/v2/post/publish/creator_info/query/',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
        },
      );

      const creatorInfo = (await creatorInfoResponse.json()) as TikTokCreatorInfoResponse;
      const privacyLevel = creatorInfo.data?.privacy_level_options?.[0] ?? 'PUBLIC_TO_EVERYONE';

      const publishResponse = await fetch(
        'https://open.tiktokapis.com/v2/post/publish/video/init/',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: JSON.stringify({
            post_info: {
              title: input.content.slice(0, 2200),
              privacy_level: privacyLevel,
              disable_comment: false,
              disable_duet: false,
              disable_stitch: false,
              is_aigc: false,
            },
            source_info: {
              source: 'PULL_FROM_URL',
              video_url: videoUrl,
            },
          }),
        },
      );

      const payload = (await publishResponse.json()) as TikTokPublishResponse;
      const publishId = payload.data?.publish_id;
      const errorCode = payload.error?.code;
      if (!publishResponse.ok || !publishId || (errorCode && errorCode !== 'ok')) {
        const message = payload.error?.message ?? 'TikTok publish init failed';
        if (publishResponse.status === 401) {
          throw ApplicationFailure.nonRetryable('TikTok auth failed', 'AuthError');
        }
        return {
          success: false,
          error: message,
        };
      }

      const statusResponse = await fetch(
        'https://open.tiktokapis.com/v2/post/publish/status/fetch/',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: JSON.stringify({
            publish_id: publishId,
          }),
        },
      );
      const statusPayload = (await statusResponse.json()) as TikTokPublishStatusResponse;
      const publicPostId = statusPayload.data?.publicaly_available_post_id?.[0];

      return {
        success: true,
        externalId: publicPostId ?? publishId,
        platformPostId: publicPostId ?? publishId,
        url: publicPostId ? `https://www.tiktok.com/player/v1/${publicPostId}` : videoUrl,
      };
    } catch (error) {
      if (error instanceof ApplicationFailure) {
        throw error;
      }
      const message = toErrorMessage(error);
      if (message.includes('401') || message.toLowerCase().includes('unauthorized')) {
        throw ApplicationFailure.nonRetryable('TikTok auth failed', 'AuthError');
      }
      return {
        success: false,
        error: message,
      };
    }
  };
}
