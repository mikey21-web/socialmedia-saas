import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface BatchResult {
  approved: number;
  failed: number;
  skipped: number;
  errors: Array<{ postId: string; message: string }>;
  warnings: Array<{ postId: string; message: string }>;
}

@Injectable()
export class ApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  async getPostByToken(token: string) {
    const record = await this.prisma.approvalToken.findUnique({
      where: { token },
    });

    if (!record) {
      throw new NotFoundException("Invalid approval link");
    }

    if (record.usedAt) {
      return { status: "already_used", action: record.action, post: null };
    }

    if (new Date() > record.expiresAt) {
      return { status: "expired", action: null, post: null };
    }

    const post = await this.prisma.post.findUnique({
      where: { id: record.postId },
      include: { platforms: true },
    });

    if (!post) {
      throw new NotFoundException("Post no longer exists");
    }

    return {
      status: "pending",
      action: null,
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        status: post.status,
        platforms: post.platforms.map((p) => p.platform),
        createdAt: post.createdAt,
      },
    };
  }

  async approveByToken(token: string) {
    const record = await this.prisma.approvalToken.findUnique({
      where: { token },
    });


    if (!record) throw new NotFoundException("Invalid approval link");
    if (record.usedAt) throw new BadRequestException("This link has already been used");
    if (new Date() > record.expiresAt) throw new BadRequestException("This link has expired");

    await this.prisma.approvalToken.update({
      where: { id: record.id },
      data: { action: "approved", usedAt: new Date() },
    });

    const post = await this.prisma.post.update({
      where: { id: record.postId },
      data: { status: "approved" },
    });

    return { success: true, postId: post.id, action: "approved" };
  }

  async rejectByToken(token: string, reason?: string) {
    const record = await this.prisma.approvalToken.findUnique({
      where: { token },
    });

    if (!record) throw new NotFoundException("Invalid approval link");
    if (record.usedAt) throw new BadRequestException("This link has already been used");
    if (new Date() > record.expiresAt) throw new BadRequestException("This link has expired");

    await this.prisma.approvalToken.update({
      where: { id: record.id },
      data: { action: "rejected", usedAt: new Date() },
    });


    const post = await this.prisma.post.update({
      where: { id: record.postId },
      data: { status: "rejected", rejectionReason: reason ?? null },
    });

    return { success: true, postId: post.id, action: "rejected" };
  }

  async batchAction(
    postIds: string[],
    action: "approve" | "reject",
    reason?: string,
  ): Promise<BatchResult> {
    if (action === "approve") {
      return this.approveBatch("", postIds);
    }
    return this.rejectBatch("", postIds, reason);
  }

  async approveBatch(
    teamId: string,
    postIds: string[],
    scheduledAt?: string,
  ): Promise<BatchResult> {
    const errors: Array<{ postId: string; message: string }> = [];
    const warnings: Array<{ postId: string; message: string }> = [];
    let approved = 0;
    let failed = 0;
    let skipped = 0;

    if (!postIds || postIds.length === 0) {
      throw new BadRequestException("At least one post ID is required");
    }

    const invalidIds = postIds.filter((id) => !this.isValidUuid(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException(`Invalid post IDs: ${invalidIds.join(", ")}`);
    }

    const whereClause: any = {
      id: { in: postIds },
      deletedAt: null,
    };
    if (teamId) {
      whereClause.teamId = teamId;
    }

    const posts = await this.prisma.post.findMany({
      where: whereClause,
      select: { id: true, status: true, teamId: true },
    });

    const foundIds = new Set(posts.map((p) => p.id));
    for (const postId of postIds) {
      if (!foundIds.has(postId)) {
        errors.push({ postId, message: "Post not found or has been deleted" });
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const postId of postIds) {
        const post = posts.find((p) => p.id === postId);
        if (!post) {
          failed++;
          continue;
        }

        if (teamId && post.teamId !== teamId) {
          errors.push({ postId, message: "Post does not belong to this team" });
          failed++;
          continue;
        }

        if (post.status !== "awaiting_approval") {
          warnings.push({ postId, message: `Post is not awaiting approval (current: ${post.status})` });
          skipped++;
          continue;
        }

        try {
          const newStatus = scheduledAt ? "scheduled" : "approved";
          await tx.post.update({
            where: { id: postId },
            data: {
              status: newStatus,
              ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
            },
          });
          approved++;
        } catch {
          failed++;
          errors.push({ postId, message: "Failed to approve post" });
        }
      }
    });

    return { approved, failed, skipped, errors, warnings };
  }

  async rejectBatch(
    teamId: string,
    postIds: string[],
    reason?: string,
  ): Promise<BatchResult> {
    const errors: Array<{ postId: string; message: string }> = [];
    const warnings: Array<{ postId: string; message: string }> = [];
    let rejected = 0;
    let failed = 0;
    let skipped = 0;

    if (!postIds || postIds.length === 0) {
      throw new BadRequestException("At least one post ID is required");
    }

    const invalidIds = postIds.filter((id) => !this.isValidUuid(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException(`Invalid post IDs: ${invalidIds.join(", ")}`);
    }

    const whereClause: any = {
      id: { in: postIds },
      deletedAt: null,
    };
    if (teamId) {
      whereClause.teamId = teamId;
    }

    const posts = await this.prisma.post.findMany({
      where: whereClause,
      select: { id: true, status: true, teamId: true },
    });

    const foundIds = new Set(posts.map((p) => p.id));
    for (const postId of postIds) {
      if (!foundIds.has(postId)) {
        errors.push({ postId, message: "Post not found or has been deleted" });
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const postId of postIds) {
        const post = posts.find((p) => p.id === postId);
        if (!post) {
          failed++;
          continue;
        }

        if (teamId && post.teamId !== teamId) {
          errors.push({ postId, message: "Post does not belong to this team" });
          failed++;
          continue;
        }

        if (post.status !== "awaiting_approval") {
          warnings.push({ postId, message: `Post is not awaiting approval (current: ${post.status})` });
          skipped++;
          continue;
        }

        try {
          await tx.post.update({
            where: { id: postId },
            data: { status: "rejected", rejectionReason: reason ?? null },
          });
          rejected++;
        } catch {
          failed++;
          errors.push({ postId, message: "Failed to reject post" });
        }
      }
    });

    return { approved: rejected, failed, skipped, errors, warnings };
  }

  async getPendingPosts(teamId: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        teamId,
        status: { in: ["awaiting_approval", "pending"] },
        deletedAt: null,
      },
      include: {
        platforms: {
          select: { platform: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return posts;
  }

  private isValidUuid(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}
