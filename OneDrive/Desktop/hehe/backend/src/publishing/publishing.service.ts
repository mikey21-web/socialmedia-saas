import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemporalClientService } from '../temporal/client';
import { LinkedinPublisher } from './publishers/linkedin.publisher';
import { TwitterPublisher } from './publishers/twitter.publisher';
import { publishPostWorkflow } from './workflows/publish.workflow';

@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly temporalClient: TemporalClientService,
    private readonly twitterPublisher: TwitterPublisher,
    private readonly linkedinPublisher: LinkedinPublisher,
  ) {}

async startPublishWorkflow(postId: string, teamId: string, scheduledAt?: Date) {
    const client = await this.temporalClient.getClient();
    const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? 'posts-queue';
    const handle = await client.workflow.start(publishPostWorkflow, {
      args: [{ postId, teamId, taskQueue, scheduledAt }],
      taskQueue,
      workflowId: `publish-${postId}-${Date.now()}`,
    });
    return handle.workflowId;
  }

  async publishPost(postId: string, teamId?: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        ...(teamId ? { teamId } : {}),
        deletedAt: null,
      },
      include: {
        platforms: true,
      },
    });

    if (!post) {
      return { success: false, platforms: [] };
    }

    const claimed = await this.claimPostForPublishing(post.id, post.teamId, ['draft', 'scheduled', 'publishing']);
    if (!claimed && post.status !== 'publishing') {
      return { success: false, platforms: [] };
    }

    const results: Array<{
      platform: string;
      status: string;
      platformPostId?: string;
      error?: string;
    }> = [];

    for (const platform of post.platforms) {
      const normalizedPlatform = platform.platform === 'twitter' ? 'x' : platform.platform;
      const credential = await this.prisma.platformCredential.findFirst({
        where: { teamId: post.teamId, platform: normalizedPlatform },
        orderBy: { createdAt: 'asc' },
      });

      if (!credential) {
        const error = `No ${platform.platform} credential connected`;
        await this.markPlatformFailed(post.id, platform.platform, error);
        results.push({ platform: platform.platform, status: 'failed', error });
        continue;
      }

      try {
        const published = normalizedPlatform === 'x'
          ? await this.twitterPublisher.publish(post.id, credential.id)
          : normalizedPlatform === 'linkedin'
            ? await this.linkedinPublisher.publish(post.id, credential.id)
            : null;

        if (!published) {
          throw new Error(`${platform.platform} publisher is not implemented`);
        }

        await this.writePublishLog(post.id, platform.platform, 'published', published.platformPostId);
        results.push({
          platform: platform.platform,
          status: 'published',
          platformPostId: published.platformPostId,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Publish failed';
        await this.markPlatformFailed(post.id, platform.platform, message);
        results.push({ platform: platform.platform, status: 'failed', error: message });
      }
    }

    const successCount = results.filter((result) => result.status === 'published').length;
    const nextStatus = successCount === results.length
      ? 'published'
      : successCount === 0
        ? 'failed'
        : 'partial';

    await this.prisma.post.update({
      where: { id: post.id },
      data: { status: nextStatus },
    });

    return {
      success: successCount === results.length,
      platforms: results,
    };
  }

  async startPublishPostWorkflow(postId: string, teamId: string) {
    const claimed = await this.claimPostForPublishing(postId, teamId, ['draft', 'scheduled']);
    if (!claimed) {
      return { workflowId: null };
    }

    let workflowId: string;
    try {
      workflowId = await this.startPublishWorkflow(postId, teamId);
    } catch (error) {
      await this.markPostPublishStartFailed(postId);
      throw error;
    }

    this.logger.log(`Publish workflow started: ${workflowId}`);
    return { workflowId };
  }

async publishDuePosts() {
    const duePosts = await this.prisma.post.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: { lte: new Date() },
        deletedAt: null,
      },
      select: { id: true, teamId: true, scheduledAt: true },
    });

    const workflowIds: string[] = [];
    for (const post of duePosts) {
      const claimed = await this.claimPostForPublishing(post.id, post.teamId, ['scheduled']);
      if (!claimed) {
        continue;
      }

      try {
        const workflowId = await this.startPublishWorkflow(post.id, post.teamId, post.scheduledAt ?? undefined);
        workflowIds.push(workflowId);
      } catch (error) {
        await this.markPostPublishStartFailed(post.id);
        this.logger.error(`Failed to start publish workflow for ${post.id}`, error);
      }
    }

    return workflowIds;
  }

  private async claimPostForPublishing(
    postId: string,
    teamId: string,
    allowedStatuses: string[],
  ) {
    const result = await this.prisma.post.updateMany({
      where: {
        id: postId,
        teamId,
        status: { in: allowedStatuses },
        deletedAt: null,
      },
      data: { status: 'publishing' },
    });

    if (result.count === 0) {
      return false;
    }

    await this.prisma.postPlatform.updateMany({
      where: { postId },
      data: { status: 'publishing' },
    });
    return true;
  }

  private async markPostPublishStartFailed(postId: string) {
    await this.prisma.post.update({
      where: { id: postId },
      data: { status: 'failed' },
    });
    await this.prisma.postPlatform.updateMany({
      where: { postId },
      data: { status: 'failed' },
    });
  }

  private async markPlatformFailed(postId: string, platform: string, error: string) {
    await this.prisma.postPlatform.updateMany({
      where: { postId, platform },
      data: { status: 'failed' },
    });
    await this.writePublishLog(postId, platform, 'failed', undefined, error);
  }

  private async writePublishLog(
    postId: string,
    platform: string,
    status: string,
    platformPostId?: string,
    error?: string,
  ) {
    const attemptNumber = await this.prisma.postPublishLog.count({
      where: { postId, platform },
    }) + 1;

    await this.prisma.postPublishLog.create({
      data: {
        postId,
        platform,
        status,
        platformPostId,
        error,
        attemptNumber,
      },
    });
  }
}
