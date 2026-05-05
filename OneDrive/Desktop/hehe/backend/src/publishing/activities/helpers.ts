import { BadRequestException } from '@nestjs/common';
import { PlatformsService } from '../../platforms/platforms.service';

export function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

export function isHttpStatus(error: unknown, code: number) {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const status = (error as { status?: unknown; code?: unknown }).status
    ?? (error as { status?: unknown; code?: unknown }).code;
  return status === code;
}

export async function getAccessToken(
  platformsService: PlatformsService,
  userId: string,
  platform: string,
  platformCredentialId?: string,
) {
  const credential = platformCredentialId
    ? await platformsService.getCredentialById(userId, platformCredentialId)
    : await platformsService.getCredential(userId, platform);
  if (!credential.accessToken) {
    throw new BadRequestException(`Missing access token for ${platform}`);
  }
  return credential.accessToken;
}
