import { ApplicationFailure } from '@temporalio/activity';
import { PlatformsService } from '../../platforms/platforms.service';
import { PublishActivityInput, PublishActivityResult } from '../types';
import { getAccessToken, toErrorMessage } from './helpers';

const LI_HEADERS = {
  'LinkedIn-Version': '202601',
  'X-Restli-Protocol-Version': '2.0.0',
  'Content-Type': 'application/json',
};

async function getPersonId(accessToken: string): Promise<string> {
  const res = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    throw ApplicationFailure.nonRetryable('LinkedIn auth failed', 'AuthError');
  }

  const json = (await res.json()) as { sub?: string };

  if (!json.sub) {
    throw new Error('LinkedIn profile id not found');
  }

  return json.sub;
}

async function uploadMedia(
  mediaUrl: string,
  accessToken: string,
  personId: string,
): Promise<string> {
  const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(mediaUrl);
  const endpoint = isVideo ? 'videos' : 'images';

  const mediaRes = await fetch(mediaUrl);
  const buffer = Buffer.from(await mediaRes.arrayBuffer());

  const initRes = await fetch(
    `https://api.linkedin.com/rest/${endpoint}?action=initializeUpload`,
    {
      method: 'POST',
      headers: { ...LI_HEADERS, Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: `urn:li:person:${personId}`,
          ...(isVideo
            ? {
                fileSizeBytes: buffer.length,
                uploadCaptions: false,
                uploadThumbnail: false,
              }
            : {}),
        },
      }),
    },
  );

  const initJson = (await initRes.json()) as {
    value?: {
      uploadUrl?: string;
      image?: string;
      video?: string;
      uploadInstructions?: { uploadUrl: string }[];
    };
  };

  const uploadUrl =
    initJson.value?.uploadInstructions?.[0]?.uploadUrl ??
    initJson.value?.uploadUrl;
  const mediaUrn = initJson.value?.video ?? initJson.value?.image;

  if (!uploadUrl || !mediaUrn) {
    throw new Error('LinkedIn upload initialization failed');
  }

  await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202601',
    },
    body: buffer,
  });

  if (isVideo) {
    await fetch('https://api.linkedin.com/rest/videos?action=finalizeUpload', {
      method: 'POST',
      headers: { ...LI_HEADERS, Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        finalizeUploadRequest: {
          video: mediaUrn,
          uploadToken: '',
          uploadedPartIds: [],
        },
      }),
    });
  }

  return mediaUrn;
}

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

      const personId = await getPersonId(accessToken);
      const mediaUrls = input.mediaUrls ?? [];

      const mediaUrns: string[] = [];
      for (const url of mediaUrls) {
        const urn = await uploadMedia(url, accessToken, personId);
        mediaUrns.push(urn);
      }

      const postBody = {
        author: `urn:li:person:${personId}`,
        commentary: input.content,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [] as string[],
          thirdPartyDistributionChannels: [] as string[],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
        ...(mediaUrns.length === 1
          ? { content: { media: { id: mediaUrns[0] } } }
          : mediaUrns.length > 1
          ? { content: { multiImage: { images: mediaUrns.map((id) => ({ id })) } } }
          : {}),
      };

      const res = await fetch('https://api.linkedin.com/rest/posts', {
        method: 'POST',
        headers: { ...LI_HEADERS, Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(postBody),
      });

      if (res.status !== 201 && res.status !== 200) {
        const err = (await res.json()) as { message?: string };
        throw new Error(err.message ?? 'LinkedIn publish failed');
      }

      const postId = res.headers.get('x-restli-id') ?? '';

      return { success: true, externalId: postId };
    } catch (error) {
      if (error instanceof ApplicationFailure) throw error;
      return { success: false, error: toErrorMessage(error) };
    }
  };
}
