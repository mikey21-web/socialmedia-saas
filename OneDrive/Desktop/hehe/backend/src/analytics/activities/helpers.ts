import { PlatformsService } from '../../platforms/platforms.service';

export async function readPlatformToken(
  platformsService: PlatformsService,
  userId: string,
  platform: string,
) {
  const credential = await platformsService.getCredential(userId, platform);
  return credential.accessToken;
}

export function asNumber(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}
