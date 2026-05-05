import { ApplicationFailure } from '@temporalio/activity';
import { PlatformsService } from '../../platforms/platforms.service';
import { PublishActivityInput, PublishActivityResult } from '../types';
import { getAccessToken, toErrorMessage } from './helpers';

type InstagramCreationResponse = {
  id?: string;
  error?: { message?: string };
};

export function buildPublishInstagramActivity(platformsService: PlatformsService) {
  return async function publishInstagram(
    input: PublishActivityInput,
  ): Promise<PublishActivityResult> {
    if (!input.mediaUrls?.length) {
      throw ApplicationFailure.nonRetryable(
        'Instagram requires at least one media URL',
        'ValidationError',
      );
    }

    try {
      const accessToken = await getAccessToken(
        platformsService,
        input.userId,
        'instagram',
        input.platformCredentialId,
      );
      const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
      if (!accountId) {
        throw ApplicationFailure.nonRetryable(
          'INSTAGRAM_BUSINESS_ACCOUNT_ID is not configured',
          'ConfigurationError',
        );
      }

      const mediaResponse = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: input.mediaUrls[0],
            caption: input.content,
            access_token: accessToken,
          }),
        },
      );
      const mediaPayload = (await mediaResponse.json()) as InstagramCreationResponse;
      if (!mediaResponse.ok || !mediaPayload.id) {
        throw new Error(mediaPayload.error?.message ?? 'Instagram media creation failed');
      }

      const publishResponse = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: mediaPayload.id,
            access_token: accessToken,
          }),
        },
      );
      const publishPayload = (await publishResponse.json()) as InstagramCreationResponse;
      if (!publishResponse.ok || !publishPayload.id) {
        throw new Error(publishPayload.error?.message ?? 'Instagram publish failed');
      }

      return {
        success: true,
        externalId: publishPayload.id,
      };
    } catch (error) {
      return {
        success: false,
        error: toErrorMessage(error),
      };
    }
  };
}
