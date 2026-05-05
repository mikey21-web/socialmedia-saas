import { PlatformsService } from '../../platforms/platforms.service';
import { PublishActivityInput, PublishActivityResult } from '../types';
import { getAccessToken, toErrorMessage } from './helpers';

type FacebookPostResponse = {
  id?: string;
  error?: { message?: string };
};

export function buildPublishFacebookActivity(platformsService: PlatformsService) {
  return async function publishFacebook(
    input: PublishActivityInput,
  ): Promise<PublishActivityResult> {
    try {
      const accessToken = await getAccessToken(
        platformsService,
        input.userId,
        'facebook',
        input.platformCredentialId,
      );
      const pageId = process.env.FACEBOOK_PAGE_ID;
      if (!pageId) {
        throw new Error('FACEBOOK_PAGE_ID is not configured');
      }

      const endpoint = input.mediaUrls?.length
        ? `https://graph.facebook.com/v19.0/${pageId}/photos`
        : `https://graph.facebook.com/v19.0/${pageId}/feed`;
      const body = input.mediaUrls?.length
        ? {
          message: input.content,
          url: input.mediaUrls[0],
          access_token: accessToken,
        }
        : {
          message: input.content,
          access_token: accessToken,
        };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as FacebookPostResponse;
      if (!response.ok || !payload.id) {
        throw new Error(payload.error?.message ?? 'Facebook publish failed');
      }

      return {
        success: true,
        externalId: payload.id,
      };
    } catch (error) {
      return {
        success: false,
        error: toErrorMessage(error),
      };
    }
  };
}
