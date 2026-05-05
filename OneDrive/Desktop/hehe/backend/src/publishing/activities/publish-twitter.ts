import { ApplicationFailure } from '@temporalio/activity';
import { TwitterApi } from 'twitter-api-v2';
import { PlatformsService } from '../../platforms/platforms.service';
import { PublishActivityInput, PublishActivityResult } from '../types';
import { getAccessToken, isHttpStatus, toErrorMessage } from './helpers';

export function buildPublishTwitterActivity(platformsService: PlatformsService) {
  return async function publishTwitter(
    input: PublishActivityInput,
  ): Promise<PublishActivityResult> {
    try {
      const accessToken = await getAccessToken(
        platformsService,
        input.userId,
        'twitter',
        input.platformCredentialId,
      );
      const client = new TwitterApi(accessToken);
      const response = await client.v2.tweet(input.content);

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
