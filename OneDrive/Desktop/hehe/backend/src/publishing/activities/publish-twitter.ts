import { ApplicationFailure } from '@temporalio/activity';
import { TwitterApi } from 'twitter-api-v2';
import { PlatformsService } from '../../platforms/platforms.service';
import { PublishActivityInput, PublishActivityResult } from '../types';
import { getAccessToken, isHttpStatus, toErrorMessage } from './helpers';

async function uploadMediaToTwitter(
  client: TwitterApi,
  mediaUrl: string,
): Promise<string> {
  const res = await fetch(mediaUrl);
  const buffer = Buffer.from(await res.arrayBuffer());

  const mimeType = res.headers.get('content-type') ?? 'image/jpeg';
  const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(mediaUrl);

  const mediaId = await client.v1.uploadMedia(buffer, {
    type: mimeType,
    ...(isVideo ? { target: 'tweet' } : {}),
  } as Parameters<typeof client.v1.uploadMedia>[1]);

  return mediaId;
}

export function buildPublishTwitterActivity(platformsService: PlatformsService) {
  return async function publishTwitter(
    input: PublishActivityInput,
  ): Promise<PublishActivityResult> {
    try {
      const accessToken = await getAccessToken(
        platformsService,
        input.userId,
        'x',
        input.platformCredentialId,
      );

      // accessToken may be "token" (OAuth2) or "accessToken:accessSecret" (OAuth1)
      const parts = accessToken.split(':');
      const isOAuth1 = parts.length === 2 && !!process.env.X_API_KEY && !!process.env.X_API_SECRET;

      const client = isOAuth1
        ? new TwitterApi({
            appKey: process.env.X_API_KEY!,
            appSecret: process.env.X_API_SECRET!,
            accessToken: parts[0],
            accessSecret: parts[1],
          })
        : new TwitterApi(accessToken);

      const mediaUrls = input.mediaUrls ?? [];
      const mediaIds: string[] = [];

      if (mediaUrls.length && isOAuth1) {
        for (const url of mediaUrls.slice(0, 4)) {
          const id = await uploadMediaToTwitter(client, url);
          mediaIds.push(id);
        }
      }

      type MediaTuple = [string] | [string, string] | [string, string, string] | [string, string, string, string];
      const response = await client.v2.tweet({
        text: input.content,
        ...(mediaIds.length
          ? { media: { media_ids: mediaIds.slice(0, 4) as MediaTuple } }
          : {}),
      });

      return {
        success: true,
        externalId: response.data.id,
      };
    } catch (error) {
      if (isHttpStatus(error, 401)) {
        throw ApplicationFailure.nonRetryable('Twitter auth failed', 'AuthError');
      }
      if (isHttpStatus(error, 429)) {
        throw ApplicationFailure.retryable('Twitter rate limit', 'RateLimitError');
      }
      return {
        success: false,
        error: toErrorMessage(error),
      };
    }
  };
}
