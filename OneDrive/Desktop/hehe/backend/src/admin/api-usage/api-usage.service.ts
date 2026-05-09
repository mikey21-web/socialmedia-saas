import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { percent } from '../admin-utils';

@Injectable()
export class ApiUsageService {
  constructor(private readonly prisma: PrismaService) {}

  topEndpoints() {
    return this.prisma.db.apiUsageLog.groupBy({
      by: ['endpoint', 'method'],
      _count: { _all: true },
      _avg: { responseTimeMs: true },
      orderBy: { _count: { endpoint: 'desc' } },
      take: 10,
    });
  }

  slowestEndpoints() {
    return this.prisma.db.apiUsageLog.groupBy({
      by: ['endpoint', 'method'],
      _count: { _all: true },
      _avg: { responseTimeMs: true },
      orderBy: { _avg: { responseTimeMs: 'desc' } },
      take: 10,
    });
  }

  async errorEndpoints() {
    const rows = await this.prisma.db.apiUsageLog.groupBy({
      by: ['endpoint', 'method'],
      _count: { _all: true },
      where: { statusCode: { gte: 400 } },
      orderBy: { _count: { endpoint: 'desc' } },
      take: 10,
    });
    const totals = await this.prisma.db.apiUsageLog.groupBy({ by: ['endpoint', 'method'], _count: { _all: true } });
    return rows.map((row: { endpoint: string; method: string; _count: { _all: number } }) => {
      const total = totals.find((item: { endpoint: string; method: string }) => item.endpoint === row.endpoint && item.method === row.method)?._count?._all ?? row._count._all;
      return { ...row, errorRate: percent(row._count._all, total) };
    });
  }
}
