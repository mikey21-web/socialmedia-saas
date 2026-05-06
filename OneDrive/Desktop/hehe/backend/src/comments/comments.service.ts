import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensurePostAccess(postId: string, teamId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, teamId, deletedAt: null },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }
  }

  async create(postId: string, teamId: string, authorId: string, content: string) {
    await this.ensurePostAccess(postId, teamId);
    return this.prisma.comment.create({
      data: { postId, teamId, authorId, content },
    });
  }

  async findAll(postId: string, teamId: string) {
    await this.ensurePostAccess(postId, teamId);
    return this.prisma.comment.findMany({
      where: { postId, teamId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async remove(postId: string, commentId: string, teamId: string, userId: string) {
    await this.ensurePostAccess(postId, teamId);
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, postId, teamId, deletedAt: null },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
