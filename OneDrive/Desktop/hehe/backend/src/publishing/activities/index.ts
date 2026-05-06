import { PrismaService } from '../../prisma/prisma.service';
import { PlatformsService } from '../../platforms/platforms.service';
import { EmailService } from '../../email/email.service';
import { CronExpressionParser } from 'cron-parser';
import { PublishActivityResult, PlatformPublishJob } from '../types';
import { buildPublishFacebookActivity } from './publish-facebook';
import { buildPublishInstagramActivity } from './publish-instagram';
import { buildPublishLinkedInActivity } from './publish-linkedin';
import { buildPublishTwitterActivity } from './publish-twitter';
import { buildPublishYouTubeActivity } from './publish-youtube';
import { createTokenRefreshActivities } from './token-refresh.activities';

export type FinalizePlatformResult = {
  postPlatformId: string;
  platform: string;
  success: boolean;
  externalId?: string;
  error?: string;
};

export function createPublishingActivities(
  prisma: PrismaService,
  platformsService: PlatformsService,
  emailService?: EmailService,
) {
  return {
    preparePublishPost: async (input: { postId: string; teamId: string }) => {
      const post = await prisma.post.findFirst({
        where: {
          id: input.postId,
          teamId: input.teamId,
          deletedAt: null,
        },
        include: {
          team: {
            select: {
              ownerId: true,
            },
          },
          platforms: {
            select: {
              id: true,
              platform: true,
            },
          },
        },
      });

      if (!post) {
        throw new Error('Post not found for publish workflow');
      }

      const credentials = await prisma.platformCredential.findMany({
        where: {
          teamId: input.teamId,
          platform: {
            in: post.platforms.map((platform) => platform.platform),
          },
        },
        select: {
          id: true,
          platform: true,
        },
      });

      const credentialsMap = new Map(
        credentials.map((credential) => [credential.platform, credential.id]),
      );
      const mediaUrls = Array.isArray(post.mediaUrls)
        ? post.mediaUrls.filter((url): url is string => typeof url === 'string')
        : [];

      const jobs: PlatformPublishJob[] = post.platforms.map((postPlatform) => ({
        postPlatformId: postPlatform.id,
        postId: post.id,
        teamId: post.teamId,
        platform: postPlatform.platform,
        content: post.content,
        mediaUrls,
        userId: post.team.ownerId,
        platformCredentialId: credentialsMap.get(postPlatform.platform),
      }));

      return {
        postId: post.id,
        jobs,
      };
    },
    publishTwitter: buildPublishTwitterActivity(platformsService),
    publishInstagram: buildPublishInstagramActivity(platformsService),
    publishLinkedIn: buildPublishLinkedInActivity(platformsService),
    publishFacebook: buildPublishFacebookActivity(platformsService),
    publishYouTube: buildPublishYouTubeActivity(platformsService),
    finalizePublishPost: async (input: {
      postId: string;
      teamId: string;
      results: FinalizePlatformResult[];
    }) => {
      const failedResults = input.results.filter((result) => !result.success);
      await prisma.$transaction(async (tx) => {
        for (const result of input.results) {
          await tx.postPlatform.update({
            where: { id: result.postPlatformId },
            data: {
              platformPostId: result.externalId,
              status: result.success ? 'published' : 'failed',
            },
          });
        }

        const successfulCount = input.results.filter((result) => result.success).length;
        const finalStatus = successfulCount === input.results.length
          ? 'published'
          : successfulCount > 0
            ? 'partially_published'
            : 'failed';

        await tx.post.update({
          where: { id: input.postId },
          data: { status: finalStatus },
        });
      });

      if (failedResults.length && emailService) {
        const post = await prisma.post.findUnique({
          where: { id: input.postId },
          include: {
            team: {
              include: {
                members: {
                  include: { user: true },
                  orderBy: { id: 'asc' },
                  take: 1,
                },
              },
            },
          },
        });
        const email = post?.team.members[0]?.user.email;
        if (email) {
          await emailService.sendPublishFailureEmail(
            email,
            input.postId,
            failedResults.map((result) => result.platform),
            failedResults.map((result) => result.error).filter(Boolean).join('; '),
          );
        }
      }
    },
    handleRecurringPost: async (input: { postId: string; teamId: string }) => {
      const post = await prisma.post.findFirst({
        where: {
          id: input.postId,
          teamId: input.teamId,
          deletedAt: null,
        },
        select: {
          id: true,
          isRecurring: true,
          recurrencePattern: true,
          recurrenceEndAt: true,
          nextPublishAt: true,
          scheduledAt: true,
        },
      });

      if (!post?.isRecurring || !post.recurrencePattern) {
        return;
      }

      const currentDate = post.nextPublishAt ?? post.scheduledAt ?? new Date();

      try {
        const iterator = CronExpressionParser.parse(post.recurrencePattern, { currentDate });
        const nextPublishAt = iterator.next().toDate();

        if (post.recurrenceEndAt && nextPublishAt > post.recurrenceEndAt) {
          await prisma.post.update({
            where: { id: post.id },
            data: { isRecurring: false, nextPublishAt: null },
          });
          return;
        }

        await prisma.post.update({
          where: { id: post.id },
          data: {
            isRecurring: true,
            nextPublishAt,
            scheduledAt: nextPublishAt,
            status: 'scheduled',
          },
        });
      } catch {
        await prisma.post.update({
          where: { id: post.id },
          data: { isRecurring: false, nextPublishAt: null },
        });
      }
    },
    ...createTokenRefreshActivities(prisma, platformsService),
    markPublishFailure: async (input: {
      postPlatformId: string;
      error: string;
    }) => {
      await prisma.postPlatform.update({
        where: { id: input.postPlatformId },
        data: { status: 'failed' },
      });
      return {
        success: false,
        error: input.error,
      } satisfies PublishActivityResult;
    },
  };
}

