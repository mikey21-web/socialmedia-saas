import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalEmailService } from '../approval/email.service';
import { TeamsService } from '../teams/teams.service';

@Injectable()
export class InboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teamsService: TeamsService,
    private readonly approvalEmailService: ApprovalEmailService,
  ) {}

  async list(
    teamId: string,
    filters?: {
      status?: string;
      platform?: string;
      generatedBy?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      teamId,
      deletedAt: null,
      status: filters?.status ?? 'awaiting_approval',
    };

    if (filters?.generatedBy) {
      where.generatedBy = filters.generatedBy;
    }

    if (filters?.platform) {
      where.platforms = {
        some: { platform: filters.platform },
      };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: { platforms: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts: posts.map((p) => ({
        ...p,
        platforms: p.platforms.map((pp) => pp.platform),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approve(
    teamId: string,
    postId: string,
    scheduledAt?: string,
  ) {
    const post = await this.findPostOrThrow(teamId, postId);

    if (post.status !== 'awaiting_approval') {
      throw new BadRequestException(`Post status is "${post.status}", expected "awaiting_approval"`);
    }

    const data: any = {
      status: scheduledAt ? 'scheduled' : 'approved',
    };

    if (scheduledAt) {
      data.scheduledAt = new Date(scheduledAt);
    }

    return this.prisma.post.update({
      where: { id: postId },
      data,
      include: { platforms: true },
    });
  }

  async reject(teamId: string, postId: string, reason?: string) {
    const post = await this.findPostOrThrow(teamId, postId);

    if (post.status !== 'awaiting_approval') {
      throw new BadRequestException(`Post status is "${post.status}", expected "awaiting_approval"`);
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        status: 'rejected',
        rejectionReason: reason ?? null,
      },
      include: { platforms: true },
    });
  }

  async editPost(teamId: string, postId: string, updates: { content?: string; title?: string; scheduledAt?: string }) {
    await this.findPostOrThrow(teamId, postId);

    const data: any = {};
    if (updates.content !== undefined) data.content = updates.content;
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.scheduledAt !== undefined) data.scheduledAt = new Date(updates.scheduledAt);

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        ...data,
        generationContext: {
          ...(await this.prisma.post.findUnique({ where: { id: postId }, select: { generationContext: true } }).then((p) => (p?.generationContext as any) ?? {})),
          userEdited: true,
          editedAt: new Date().toISOString(),
        },
      },
      include: { platforms: true },
    });
  }

  async bulkApprove(teamId: string, postIds: string[], scheduledAt?: string) {
    const results = await Promise.all(
      postIds.map((id) => this.approve(teamId, id, scheduledAt).catch((e) => ({ id, error: e.message }))),
    );
    return results;
  }

  async bulkReject(teamId: string, postIds: string[], reason?: string) {
    const results = await Promise.all(
      postIds.map((id) => this.reject(teamId, id, reason).catch((e) => ({ id, error: e.message }))),
    );
    return results;
  }

  async getStats(teamId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [awaiting, approvedToday, rejectedToday] = await Promise.all([
      this.prisma.post.count({
        where: { teamId, status: 'awaiting_approval', deletedAt: null },
      }),
      this.prisma.post.count({
        where: {
          teamId,
          status: { in: ['approved', 'scheduled'] },
          updatedAt: { gte: today },
          deletedAt: null,
        },
      }),
      this.prisma.post.count({
        where: {
          teamId,
          status: 'rejected',
          updatedAt: { gte: today },
          deletedAt: null,
        },
      }),
    ]);

    return { awaiting, approvedToday, rejectedToday };
  }

  async sendApprovalEmail(teamId: string, postId: string, recipientEmail: string, platform?: string) {
    const post = await this.findPostOrThrow(teamId, postId);

    const token = await this.approvalEmailService.createTokenAndSendEmail({
      postId: post.id,
      teamId,
      title: post.title,
      content: post.content,
      platform: platform ?? post.platforms[0]?.platform ?? 'multiple',
      recipientEmail,
    });

    return { success: true, token };
  }

  private async findPostOrThrow(teamId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, teamId, deletedAt: null },
      include: { platforms: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }
}
