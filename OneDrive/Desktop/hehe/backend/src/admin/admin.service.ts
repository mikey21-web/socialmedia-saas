import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics() {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const [totalTeams, totalUsers, postsThisWeek, activeSubscriptions] = await Promise.all([
      this.prisma.team.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.post.count({ where: { createdAt: { gte: weekStart }, deletedAt: null } }),
      this.prisma.subscription.count({ where: { plan: 'pro', status: { in: ['active', 'trialing'] } } }),
    ]);

    return { totalTeams, totalUsers, postsThisWeek, activeSubscriptions };
  }

  async getTeams(search?: string) {
    return this.prisma.team.findMany({
      where: {
        deletedAt: null,
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true } },
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeam(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        subscription: true,
        members: {
          include: { user: { select: { id: true, email: true, name: true, role: true } } },
          orderBy: { id: 'asc' },
        },
        posts: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, title: true, status: true, createdAt: true, scheduledAt: true },
        },
        _count: { select: { posts: true, members: true } },
      },
    });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async suspendTeam(id: string) {
    return this.prisma.team.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }

  async suspendUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { suspended: true, suspendedAt: new Date() },
      select: { id: true, email: true, suspended: true, suspendedAt: true },
    });
  }

  async getUsers(page = 1, limit = 20, search?: string, suspended?: boolean) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null,
      ...(search ? { email: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(suspended === undefined ? {} : { suspended }),
    };

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

    const teamMember = await this.prisma.teamMember.findFirst({
      where: { userId: adminId },
      select: { teamId: true },
    });

    await this.prisma.auditLog.create({
      data: {
        teamId: teamMember?.teamId ?? '',
        userId: adminId,
        action: data.suspended ? 'suspend_user' : data.role ? 'change_role' : 'update_user',
        entityId: id,
        entity: 'User',
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

    const teamMember = await this.prisma.teamMember.findFirst({
      where: { userId: adminId },
      select: { teamId: true },
    });

    await this.prisma.auditLog.create({
      data: {
        teamId: teamMember?.teamId ?? post.teamId,
        userId: adminId,
        action: 'delete_post',
        entityId: postId,
        entity: 'Post',
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
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);

    return { logs, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
