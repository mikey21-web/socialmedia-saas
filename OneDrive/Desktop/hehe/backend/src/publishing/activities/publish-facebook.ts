import { PlatformsService } from '../../platforms/platforms.service';
import { PublishActivityInput, PublishActivityResult } from '../types';
import { toErrorMessage } from './helpers';

const GRAPH = 'https://graph.facebook.com/v20.0';

export function buildPublishFacebookActivity(platformsService: PlatformsService) {
  return async function publishFacebook(
    input: PublishActivityInput,
  ): Promise<PublishActivityResult> {
    try {
      const credential = input.platformCredentialId
        ? await platformsService.getCredentialById(input.userId, input.platformCredentialId)
        : await platformsService.getCredential(input.userId, 'facebook');

      const pageToken = credential.accessToken;
      const pageId = credential.accountId;

      if (!pageId) {
        throw new Error(
          'Facebook Page ID missing — re-connect your Facebook account',
        );
      }

      const mediaUrls = input.mediaUrls ?? [];
      const firstMedia = mediaUrls[0];
      let finalId = '';

      if (firstMedia && /\.(mp4|mov|avi|mkv)$/i.test(firstMedia)) {
        const res = await fetch(
          `${GRAPH}/${pageId}/videos?fields=id&access_token=${pageToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_url: firstMedia,
              description: input.content,
              published: true,
            }),
          },
        );
        const json = (await res.json()) as { id?: string; error?: { message?: string } };
        if (!res.ok || !json.id) {
          throw new Error(json.error?.message ?? 'Facebook video upload failed');
        }
        finalId = json.id;
      } else if (mediaUrls.length > 1) {
        const uploadedPhotos = await Promise.all(
          mediaUrls.map(async (url) => {
            const res = await fetch(
              `${GRAPH}/${pageId}/photos?access_token=${pageToken}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, published: false }),
              },
            );
            const json = (await res.json()) as { id?: string; error?: { message?: string } };
            if (!res.ok || !json.id) {
              throw new Error(json.error?.message ?? 'Facebook photo upload failed');
            }
            return { media_fbid: json.id };
          }),
        );

        const res = await fetch(
          `${GRAPH}/${pageId}/feed?fields=id&access_token=${pageToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: input.content,
              attached_media: uploadedPhotos,
              published: true,
            }),
          },
        );
        const json = (await res.json()) as { id?: string; error?: { message?: string } };
        if (!res.ok || !json.id) {
          throw new Error(json.error?.message ?? 'Facebook carousel post failed');
        }
        finalId = json.id;
      } else if (mediaUrls.length === 1) {
        const res = await fetch(
          `${GRAPH}/${pageId}/photos?access_token=${pageToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: firstMedia,
              message: input.content,
              published: true,
            }),
          },
        );
        const json = (await res.json()) as {
          id?: string;
          post_id?: string;
          error?: { message?: string };
        };
        if (!res.ok || !json.id) {
          throw new Error(json.error?.message ?? 'Facebook photo post failed');
        }
        finalId = json.post_id ?? json.id;
      } else {
        const res = await fetch(
          `${GRAPH}/${pageId}/feed?access_token=${pageToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: input.content,
              published: true,
            }),
          },
        );
        const json = (await res.json()) as { id?: string; error?: { message?: string } };
        if (!res.ok || !json.id) {
          throw new Error(json.error?.message ?? 'Facebook text post failed');
        }
        finalId = json.id;
      }

      return { success: true, externalId: finalId };
    } catch (error) {
      return { success: false, error: toErrorMessage(error) };
    }
  };
}
