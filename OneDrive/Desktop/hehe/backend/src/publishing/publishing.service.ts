import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemporalClientService } from '../temporal/client';
import { publishPostWorkflow } from './workflows/publish.workflow';

@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly temporalClient: TemporalClientService,
  ) {}

  async startPublishWorkflow(postId: string, teamId: string) {
    const client = await this.temporalClient.getClient();
    const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? 'posts-queue';
    const handle = await client.workflow.start(publishPostWorkflow, {
      args: [{ postId, teamId, taskQueue }],
      taskQueue,
      workflowId: `publish-${postId}-${Date.now()}`,
    });
    return handle.workflowId;
  }

  async publishPost(postId: string, teamId: string) {
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
      select: { id: true, teamId: true },
    });

    const workflowIds: string[] = [];
    for (const post of duePosts) {
      const claimed = await this.claimPostForPublishing(post.id, post.teamId, ['scheduled']);
      if (!claimed) {
        continue;
      }

      try {
        const workflowId = await this.startPublishWorkflow(post.id, post.teamId);
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
}
