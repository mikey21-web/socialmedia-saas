import { ApplicationFailure } from '@temporalio/activity';
import { PlatformsService } from '../../platforms/platforms.service';
import { PublishActivityInput, PublishActivityResult } from '../types';
import { toErrorMessage } from './helpers';

const GRAPH = 'https://graph.facebook.com/v20.0';
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 60;

async function pollMediaStatus(creationId: string, pageToken: string): Promise<void> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const res = await fetch(
      `${GRAPH}/${creationId}?fields=status_code&access_token=${pageToken}`,
    );
    const json = (await res.json()) as {
      status_code?: string;
      error?: { message?: string };
    };

    if (json.status_code === 'FINISHED') return;
    if (json.status_code === 'ERROR' || json.status_code === 'EXPIRED') {
      throw new Error(`Instagram media processing failed: ${json.status_code}`);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error('Instagram media processing timed out');
}

async function createMediaContainer(
  igAccountId: string,
  pageToken: string,
  mediaUrl: string,
  caption: string,
  isCarouselItem: boolean,
): Promise<string> {
  const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(mediaUrl);
  const params = new URLSearchParams({ access_token: pageToken });

  if (isVideo) {
    params.set('video_url', mediaUrl);
    params.set('media_type', 'REELS');
  } else {
    params.set('image_url', mediaUrl);
  }

  if (isCarouselItem) {
    params.set('is_carousel_item', 'true');
  } else {
    params.set('caption', caption);
  }

  const res = await fetch(`${GRAPH}/${igAccountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const json = (await res.json()) as { id?: string; error?: { message?: string } };

  if (!res.ok || !json.id) {
    throw new Error(json.error?.message ?? 'Instagram media creation failed');
  }

  return json.id;
}

async function publishContainer(
  igAccountId: string,
  pageToken: string,
  creationId: string,
): Promise<string> {
  const res = await fetch(`${GRAPH}/${igAccountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      creation_id: creationId,
      access_token: pageToken,
    }).toString(),
  });
  const json = (await res.json()) as { id?: string; error?: { message?: string } };

  if (!res.ok || !json.id) {
    throw new Error(json.error?.message ?? 'Instagram publish failed');
  }

  return json.id;
}

export function buildPublishInstagramActivity(platformsService: PlatformsService) {
  return async function publishInstagram(
    input: PublishActivityInput,
  ): Promise<PublishActivityResult> {
    try {
      const credential = input.platformCredentialId
        ? await platformsService.getCredentialById(input.userId, input.platformCredentialId)
        : await platformsService.getCredential(input.userId, 'instagram');

      const pageToken = credential.accessToken;
      const igAccountId = credential.accountId;

      if (!igAccountId) {
        throw ApplicationFailure.nonRetryable(
          'Instagram Business Account ID missing — re-connect your Instagram account',
          'ConfigurationError',
        );
      }

      const mediaUrls = input.mediaUrls ?? [];

      if (!mediaUrls.length) {
        throw ApplicationFailure.nonRetryable(
          'Instagram requires at least one media URL',
          'ValidationError',
        );
      }

      let publishedId: string;

      if (mediaUrls.length === 1) {
        const creationId = await createMediaContainer(
          igAccountId,
          pageToken,
          mediaUrls[0],
          input.content,
          false,
        );
        await pollMediaStatus(creationId, pageToken);
        publishedId = await publishContainer(igAccountId, pageToken, creationId);
      } else {
        const creationIds: string[] = [];

        for (const url of mediaUrls) {
          const id = await createMediaContainer(igAccountId, pageToken, url, '', true);
          await pollMediaStatus(id, pageToken);
          creationIds.push(id);
        }

        const carouselParams = new URLSearchParams({
          media_type: 'CAROUSEL',
          children: creationIds.join(','),
          caption: input.content,
          access_token: pageToken,
        });

        const carouselRes = await fetch(`${GRAPH}/${igAccountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: carouselParams.toString(),
        });
        const carouselJson = (await carouselRes.json()) as {
          id?: string;
          error?: { message?: string };
        };

        if (!carouselRes.ok || !carouselJson.id) {
          throw new Error(carouselJson.error?.message ?? 'Instagram carousel creation failed');
        }

        await pollMediaStatus(carouselJson.id, pageToken);
        publishedId = await publishContainer(igAccountId, pageToken, carouselJson.id);
      }

      return { success: true, externalId: publishedId };
    } catch (error) {
      if (error instanceof ApplicationFailure) throw error;
      return { success: false, error: toErrorMessage(error) };
    }
  };
}
