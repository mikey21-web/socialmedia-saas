import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { percent, planMonthlyValue, startOfDay, startOfMonth } from '../admin-utils';

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const today = startOfDay();
    const month = startOfMonth();
    const previousMonth = startOfMonth(1);

    const [
      dau,
      mau,
      postsToday,
      postsThisMonth,
      activeSubs,
      canceledThisMonth,
      platformBreakdown,
      topCustomers,
    ] = await Promise.all([
      this.prisma.team.count({ where: { posts: { some: { createdAt: { gte: today }, deletedAt: null } }, deletedAt: null } }),
      this.prisma.team.count({ where: { posts: { some: { createdAt: { gte: month }, deletedAt: null } }, deletedAt: null } }),
      this.prisma.post.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
      this.prisma.post.count({ where: { createdAt: { gte: month }, deletedAt: null } }),
      this.prisma.subscription.findMany({
        where: { status: { in: ['active', 'trialing'] } },
        select: { plan: true, seats: true, teamId: true },
      }),
      this.prisma.subscription.count({ where: { canceledAt: { gte: previousMonth }, status: { in: ['canceled', 'inactive'] } } }),
      this.getPlatformBreakdown(),
      this.getTopCustomers(),
    ]);

    const mrr = activeSubs.reduce((sum, sub) => sum + planMonthlyValue(sub.plan) * Math.max(sub.seats ?? 1, 1), 0);
    const arpu = activeSubs.length ? Math.round((mrr / activeSubs.length) * 100) / 100 : 0;

    return {
      dau,
      mau,
      posts: { today: postsToday, month: postsThisMonth },
      revenue: { mrr, arpu, churnRate: percent(canceledThisMonth, activeSubs.length + canceledThisMonth) },
      platformBreakdown,
      topCustomers,
    };
  }

  async getPlatformBreakdown() {
    const platforms = ['x', 'instagram', 'linkedin', 'facebook', 'tiktok'];
    const grouped = await this.prisma.postPlatform.groupBy({
      by: ['platform', 'status'],
      _count: { _all: true },
      where: { platform: { in: ['twitter', ...platforms] } },
    });

    return platforms.map((platform) => {
      const aliases = platform === 'x' ? ['x', 'twitter'] : [platform];
      const rows = grouped.filter((row) => aliases.includes(row.platform.toLowerCase()));
      const total = rows.reduce((sum, row) => sum + row._count._all, 0);
      const published = rows.filter((row) => ['published', 'success'].includes(row.status)).reduce((sum, row) => sum + row._count._all, 0);
      return { platform, total, published, successRate: percent(published, total) };
    });
  }

  async getTopCustomers() {
    const teams = await this.prisma.team.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        subscription: { select: { plan: true, status: true } },
        _count: { select: { posts: true, members: true, agentRuns: true } },
      },
      take: 100,
    });

    const apiCounts = await this.prisma.db.apiUsageLog.groupBy({
      by: ['teamId'],
      _count: { _all: true },
      where: { teamId: { not: null } },
    });
    const apiByTeam = new Map<string, number>(apiCounts.map((row: { teamId: string; _count: { _all: number } }) => [row.teamId, row._count._all]));

    return teams
      .map((team) => ({
        id: team.id,
        name: team.name,
        plan: team.subscription?.plan ?? 'free',
        posts: team._count.posts,
        members: team._count.members,
        agentRuns: team._count.agentRuns,
        apiCalls: apiByTeam.get(team.id) ?? 0,
        usageScore: team._count.posts + team._count.agentRuns * 2 + (apiByTeam.get(team.id) ?? 0) / 25,
      }))
      .sort((a, b) => b.usageScore - a.usageScore)
      .slice(0, 10);
  }
}
