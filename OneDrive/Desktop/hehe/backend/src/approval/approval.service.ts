import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface BatchResult {
  approved: number;
  rejected: number;
  failed: number;
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
    if (!postIds || postIds.length === 0) {
      throw new BadRequestException("At least one post ID is required");
    }

    const errors: Array<{ postId: string; message: string }> = [];
    const warnings: Array<{ postId: string; message: string }> = [];
    let approved = 0;
    let rejected = 0;
    let failed = 0;

    // All-or-nothing validation: check if all postIds are valid UUIDs
    const invalidIds = postIds.filter((id) => !this.isValidUuid(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid post IDs: ${invalidIds.join(", ")}`,
      );
    }

    // Fetch all posts in one query
    const posts = await this.prisma.post.findMany({
      where: {
        id: { in: postIds },
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    // Check for non-existent posts
    const foundIds = new Set(posts.map((p) => p.id));
    for (const postId of postIds) {
      if (!foundIds.has(postId)) {
        errors.push({
          postId,
          message: "Post not found or has been deleted",
        });
      }
    }

    // Process each post
    await this.prisma.$transaction(async (tx) => {
      for (const postId of postIds) {
        const post = posts.find((p) => p.id === postId);

        if (!post) {
          failed++;
          continue;
        }


        // Skip if already in target state
        if (post.status === action) {
          warnings.push({
            postId,
            message: `Post is already ${action}d`,
          });
          if (action === "approve") approved++;
          else rejected++;
          continue;
        }

        // Skip if already published or scheduled
        if (post.status === "published" || post.status === "scheduled") {
          warnings.push({
            postId,
            message: `Cannot ${action} a ${post.status} post`,
          });
          failed++;
          continue;
        }

        try {
          await tx.post.update({
            where: { id: postId },
            data: {
              status: action,
              ...(action === "reject" ? { rejectionReason: reason ?? null } : {}),
            },
          });

          if (action === "approve") approved++;
          else rejected++;
        } catch {
          failed++;
          errors.push({
            postId,
            message: `Failed to ${action} post`,
          });
        }
      }
    });

    return {
      approved,
      rejected,
      failed,
      errors,
      warnings,
    };
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
