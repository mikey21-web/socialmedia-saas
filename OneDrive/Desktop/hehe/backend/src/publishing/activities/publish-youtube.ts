import { ApplicationFailure } from '@temporalio/activity';
import { google } from 'googleapis';
import axios from 'axios';
import { PlatformsService } from '../../platforms/platforms.service';
import { PublishActivityInput, PublishActivityResult } from '../types';
import { toErrorMessage } from './helpers';

function buildOAuthClient(accessToken: string, refreshToken: string | null) {
  const client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
  );
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
  });
  return client;
}

export function buildPublishYouTubeActivity(platformsService: PlatformsService) {
  return async function publishYouTube(
    input: PublishActivityInput,
  ): Promise<PublishActivityResult> {
    try {
      const credential = input.platformCredentialId
        ? await platformsService.getCredentialById(input.userId, input.platformCredentialId)
        : await platformsService.getCredential(input.userId, 'youtube');

      const { accessToken, refreshToken } = credential;

      const auth = buildOAuthClient(accessToken, refreshToken);
      const youtube = google.youtube({ version: 'v3', auth });

      const mediaUrls = input.mediaUrls ?? [];
      const videoUrl = mediaUrls.find((url) => /\.(mp4|mov|avi|mkv|webm)$/i.test(url));

      if (!videoUrl) {
        throw ApplicationFailure.nonRetryable(
          'YouTube requires at least one video URL',
          'ValidationError',
        );
      }

      const videoStream = await axios({
        url: videoUrl,
        responseType: 'stream',
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024,
      });

      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: input.content.slice(0, 100),
            description: input.content,
          },
          status: {
            privacyStatus: 'public',
          },
        },
        media: {
          body: videoStream.data as NodeJS.ReadableStream,
        },
      });

      const videoId = response.data.id;

      // Optional: set thumbnail from first non-video media
      const thumbnailUrl = mediaUrls.find((url) => !/\.(mp4|mov|avi|mkv|webm)$/i.test(url));
      if (thumbnailUrl && videoId) {
        try {
          const thumbStream = await axios({
            url: thumbnailUrl,
            responseType: 'stream',
            maxContentLength: 50 * 1024 * 1024,
            maxBodyLength: 50 * 1024 * 1024,
          });
          await youtube.thumbnails.set({
            videoId,
            media: { body: thumbStream.data as NodeJS.ReadableStream },
          });
        } catch {
          // thumbnail is best-effort, don't fail the publish
        }
      }

      return { success: true, externalId: videoId ?? '' };
    } catch (error) {
      if (error instanceof ApplicationFailure) throw error;
      const msg = toErrorMessage(error);
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        throw ApplicationFailure.nonRetryable('YouTube auth failed', 'AuthError');
      }
      return { success: false, error: msg };
    }
  };
}
