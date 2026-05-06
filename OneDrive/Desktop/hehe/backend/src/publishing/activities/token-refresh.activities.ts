import { ApplicationFailure } from '@temporalio/activity';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformsService } from '../../platforms/platforms.service';

type TokenRefreshActivityInput = {
  teamId: string;
  platform: string;
  userId: string;
  credentialId: string;
};

export function createTokenRefreshActivities(
  prisma: PrismaService,
  platformsService: PlatformsService,
) {
  return {
    checkTokenExpiry: async (input: TokenRefreshActivityInput) => {
      const credential = await prisma.platformCredential.findFirst({
        where: {
          id: input.credentialId,
          teamId: input.teamId,
          platform: input.platform,
        },
        select: {
          expiresAt: true,
        },
      });

      const expiresAt = credential?.expiresAt ?? null;
      const thirtyMinutesFromNow = Date.now() + 30 * 60 * 1000;
      const needsRefresh = !expiresAt || expiresAt.getTime() < thirtyMinutesFromNow;

      return { needsRefresh, expiresAt };
    },
    doTokenRefresh: async (input: TokenRefreshActivityInput) => {
      try {
        await platformsService.refreshToken(input.userId, input.credentialId);
      } catch (error) {
        if (error instanceof Error && error.message === 'NoRefreshToken') {
          throw ApplicationFailure.nonRetryable(error.message, 'NoRefreshToken');
        }
        if (error instanceof Error && error.message === 'PlatformNotSupported') {
          throw ApplicationFailure.nonRetryable(error.message, 'PlatformNotSupported');
        }
        throw error;
      }
    },
  };
}
