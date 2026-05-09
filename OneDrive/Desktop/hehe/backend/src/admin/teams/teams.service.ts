import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { startOfDay, startOfMonth } from '../admin-utils';

@Injectable()
export class AdminTeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const teams = await this.prisma.team.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastBackupAt: true,
        subscription: { select: { plan: true, status: true } },
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const apiCounts = await this.prisma.db.apiUsageLog.groupBy({ by: ['teamId'], _count: { _all: true }, where: { teamId: { not: null } } });
    const api = new Map<string, number>(apiCounts.map((row: { teamId: string; _count: { _all: number } }) => [row.teamId, row._count._all]));
    return teams.map((team) => ({ ...team, apiCalls: api.get(team.id) ?? 0 }));
  }

  async update(id: string, data: { tier?: string; plan?: string; billingStatus?: string; billing_status?: string }) {
    return this.prisma.subscription.upsert({
      where: { teamId: id },
      update: { ...(data.tier || data.plan ? { plan: data.tier ?? data.plan } : {}), ...(data.billingStatus || data.billing_status ? { status: data.billingStatus ?? data.billing_status } : {}) },
      create: { teamId: id, plan: data.tier ?? data.plan ?? 'free', status: data.billingStatus ?? data.billing_status ?? 'active' },
    });
  }

  deactivate(id: string) {
    return this.prisma.team.update({ where: { id }, data: { deletedAt: new Date() }, select: { id: true, deletedAt: true } });
  }

  async usage(id: string) {
    const today = startOfDay();
    const month = startOfMonth();
    const [dau, postsToday, postsMonth, apiCalls] = await Promise.all([
      this.prisma.team.count({ where: { id, posts: { some: { createdAt: { gte: today }, deletedAt: null } } } }),
      this.prisma.post.count({ where: { teamId: id, createdAt: { gte: today }, deletedAt: null } }),
      this.prisma.post.count({ where: { teamId: id, createdAt: { gte: month }, deletedAt: null } }),
      this.prisma.db.apiUsageLog.count({ where: { teamId: id } }),
    ]);
    return { teamId: id, dau, postsToday, postsMonth, apiCalls };
  }
}
