import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  logs(query: { teamId?: string; userId?: string; action?: string; dateFrom?: string; dateTo?: string }) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(query.teamId ? { teamId: query.teamId } : {}),
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.action ? { action: query.action } : {}),
        ...(query.dateFrom || query.dateTo
          ? { createdAt: { ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}), ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}) } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 250,
    });
  }

  async exportCsv(query: { teamId?: string; userId?: string; action?: string; dateFrom?: string; dateTo?: string }) {
    const rows = await this.logs(query);
    const header = ['id', 'teamId', 'userId', 'action', 'resource', 'entityId', 'createdAt'];
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    return [header.join(','), ...rows.map((row) => header.map((key) => escape((row as Record<string, unknown>)[key])).join(','))].join('\n');
  }
}
