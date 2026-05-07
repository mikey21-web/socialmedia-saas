import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? { email: { contains: search, mode: 'insensitive' as const }, deletedAt: null }
      : { deletedAt: null };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          suspended: true,
          createdAt: true,
          _count: { select: { teams: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        suspended: true,
        suspendedAt: true,
        createdAt: true,
        teams: {
          include: {
            team: {
              include: {
                subscription: true,
                _count: { select: { posts: true } },
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(id: string, adminId: string, data: { role?: string; suspended?: boolean }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.role !== undefined && { role: data.role }),
        ...(data.suspended !== undefined && {
          suspended: data.suspended,
          suspendedAt: data.suspended ? new Date() : null,
        }),
      },
      select: { id: true, email: true, role: true, suspended: true },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: data.suspended ? 'suspend_user' : data.role ? 'change_role' : 'update_user',
        targetId: id,
        targetType: 'User',
        metadata: data,
      },
    });

    return updated;
  }

  async getPosts(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null,
      ...(status && { status }),
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          scheduledAt: true,
          createdAt: true,
          teamId: true,
          team: { select: { name: true } },
          platforms: { select: { platform: true, status: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.count({ where }),
    ]);

    return { posts, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async deletePost(postId: string, adminId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'delete_post',
        targetId: postId,
        targetType: 'Post',
      },
    });
  }

  async getSubscriptions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        select: {
          id: true,
          plan: true,
          status: true,
          seats: true,
          currentPeriodEnd: true,
          createdAt: true,
          canceledAt: true,
          team: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count(),
    ]);

    const byPlan = await this.prisma.subscription.groupBy({
      by: ['plan'],
      _count: { plan: true },
      where: { status: 'active' },
    });

    return { subscriptions, total, page, limit, pages: Math.ceil(total / limit), byPlan };
  }

  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: { admin: { select: { email: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);

    return { logs, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
