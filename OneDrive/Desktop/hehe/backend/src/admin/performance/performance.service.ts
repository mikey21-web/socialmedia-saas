import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminPerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  dbQueries() {
    return this.prisma.db.apiUsageLog.groupBy({
      by: ['endpoint', 'method'],
      where: { endpoint: { contains: 'admin' } },
      _avg: { responseTimeMs: true },
      _count: { _all: true },
      orderBy: { _avg: { responseTimeMs: 'desc' } },
      take: 20,
    });
  }

  llmLatency() {
    return this.prisma.agentRun.findMany({
      where: { completedAt: { not: null }, agentType: { in: ['content', 'trend', 'competitor', 'agent-chat'] } },
      select: { id: true, agentType: true, startedAt: true, completedAt: true, status: true },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  temporalDuration() {
    return this.prisma.postPublishLog.findMany({
      select: { id: true, platform: true, status: true, attemptNumber: true, createdAt: true, publishedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
