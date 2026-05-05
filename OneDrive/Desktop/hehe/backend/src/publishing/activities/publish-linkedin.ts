import { ApplicationFailure } from '@temporalio/activity';
import { PlatformsService } from '../../platforms/platforms.service';
import { PublishActivityInput, PublishActivityResult } from '../types';
import { getAccessToken, toErrorMessage } from './helpers';

type LinkedInMeResponse = {
  sub?: string;
  id?: string;
};

type LinkedInPostResponse = {
  id?: string;
  error?: string;
};

export function buildPublishLinkedInActivity(platformsService: PlatformsService) {
  return async function publishLinkedIn(
    input: PublishActivityInput,
  ): Promise<PublishActivityResult> {
    try {
      const accessToken = await getAccessToken(
        platformsService,
        input.userId,
        'linkedin',
        input.platformCredentialId,
      );
      const meResponse = await fetch('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (meResponse.status === 401) {
        throw ApplicationFailure.nonRetryable('LinkedIn auth failed', 'AuthError');
      }
      const mePayload = (await meResponse.json()) as LinkedInMeResponse;
      const profileId = mePayload.id ?? mePayload.sub;
      if (!profileId) {
        throw new Error('LinkedIn profile id not found');
      }

      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: `urn:li:person:${profileId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: input.content,
              },
              shareMediaCategory: input.mediaUrls?.length ? 'IMAGE' : 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        }),
      });
      const payload = (await response.json()) as LinkedInPostResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? 'LinkedIn publish failed');
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
