import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

interface MentionedUser {
  userId: string;
  email: string;
  name: string;
}

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService?: EmailService,
  ) {}

  private async ensurePostAccess(postId: string, teamId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, teamId, deletedAt: null },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
  }

  private async resolveMentions(content: string, teamId: string): Promise<MentionedUser[]> {
    const mentionMatches = content.match(/@([a-f0-9]{25})/gi) ?? [];
    if (mentionMatches.length === 0) return [];

    const userIds = mentionMatches
      .map((m) => m.slice(1))
      .filter((id, idx, arr) => arr.indexOf(id) === idx);

    const members = await this.prisma.teamMember.findMany({
      where: { teamId, userId: { in: userIds } },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    return members.map((m) => ({
      userId: m.userId,
      email: m.user.email,
      name: m.user.name ?? m.user.email,
    }));
  }

  private async notifyMentions(postId: string, mentionedUsers: MentionedUser[], authorId: string) {
    if (!this.emailService || mentionedUsers.length === 0) return;

    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { name: true },
    });

    for (const user of mentionedUsers) {
      try {
        console.log(`Notifying ${user.email} about mention by ${author?.name} on post ${postId}`);
      } catch {
        // Ignore notification failures
      }
    }
  }

  async create(postId: string, teamId: string, authorId: string, content: string, parentCommentId?: string) {
    await this.ensurePostAccess(postId, teamId);

    if (parentCommentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: parentCommentId, postId, deletedAt: null },
        select: { id: true },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const mentionedUsers = await this.resolveMentions(content, teamId);

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        teamId,
        authorId,
        content,
        parentCommentId: parentCommentId ?? null,
        mentions: mentionedUsers.map((u) => u.userId),
      },
    });

    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { id: true, name: true, email: true },
    });

    return { ...comment, author };

    return comment;
  }

  async findAll(postId: string, teamId: string) {
    await this.ensurePostAccess(postId, teamId);
    const comments = await this.prisma.comment.findMany({
      where: { postId, teamId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    const authorIds = [...new Set(comments.map((c) => c.authorId))];
    const authors = await this.prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true, email: true },
    });
    const authorMap = new Map(authors.map((a) => [a.id, a]));

    const enriched = comments.map((c) => ({
      ...c,
      author: authorMap.get(c.authorId) ?? { id: c.authorId, name: null, email: '' },
    }));

    const topLevel = enriched.filter((c) => !c.parentCommentId);
    const replies = enriched.filter((c) => c.parentCommentId);

    return topLevel.map((comment) => ({
      ...comment,
      replies: replies.filter((r) => r.parentCommentId === comment.id),
    }));
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

    const member = await this.prisma.teamMember.findFirst({
      where: { teamId, userId },
      select: { role: true },
    });
    const isAdmin = member?.role === 'admin';

    if (comment.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}