import { Inject, Injectable, Optional } from '@nestjs/common';
import Redis from 'ioredis';
import * as Sentry from '@sentry/node';
import { REDIS_CLIENT } from '../../common/redis.provider';
import { PrismaService } from '../../prisma/prisma.service';
import { TemporalClientService } from '../../temporal/client';
import { getRecentApiStats } from '../admin-utils';

@Injectable()
export class AdminHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly temporal: TemporalClientService,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis | null,
  ) {}

  async status() {
    const database = await this.checkDatabase();
    const redis = await this.checkRedis();
    const temporal = await this.temporalJobs();
    const api = await getRecentApiStats(this.prisma);
    const sentry = await this.errors();

    return { database, redis, temporal, api, sentry, checkedAt: new Date().toISOString() };
  }

  async temporalJobs() {
    try {
      const client = await this.temporal.getClient();
      const running = client.workflow.list({ query: 'ExecutionStatus="Running"', pageSize: 20 });
      const failed = client.workflow.list({ query: 'ExecutionStatus="Failed"', pageSize: 20 });
      const [activeJobs, failedJobs] = await Promise.all([this.collectWorkflowList(running), this.collectWorkflowList(failed)]);
      return { status: 'ok', active: activeJobs.length, failed: failedJobs.length, activeJobs, failedJobs };
    } catch (error) {
      return { status: 'degraded', active: 0, failed: 0, activeJobs: [], failedJobs: [], error: error instanceof Error ? error.message : 'Temporal unavailable' };
    }
  }

  async errors() {
    const api = await getRecentApiStats(this.prisma);
    return {
      status: api.errors > 0 ? 'degraded' : 'ok',
      last24h5xx: api.errors,
      errorRate: api.errorRate,
      sentryConfigured: Boolean(process.env.SENTRY_DSN),
      sentryClientReady: Boolean(Sentry.getClient()),
    };
  }

  private async checkDatabase() {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', latencyMs: Date.now() - started };
    } catch (error) {
      return { status: 'down', latencyMs: Date.now() - started, error: error instanceof Error ? error.message : 'Database unavailable' };
    }
  }

  private async checkRedis() {
    if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) return { status: 'not_configured' };
    if (!this.redis) return { status: 'configured' };
    const started = Date.now();
    try {
      if (this.redis.status === 'wait') await this.redis.connect();
      await this.redis.ping();
      return { status: 'ok', latencyMs: Date.now() - started };
    } catch (error) {
      return { status: 'down', latencyMs: Date.now() - started, error: error instanceof Error ? error.message : 'Redis unavailable' };
    }
  }

  private async collectWorkflowList(source: AsyncIterable<unknown>) {
    const jobs: unknown[] = [];
    for await (const item of source) {
      jobs.push(item);
      if (jobs.length >= 20) break;
    }
    return jobs.map((job) => {
      const record = job as { workflowId?: string; runId?: string; type?: string; startTime?: Date };
      return { workflowId: record.workflowId, runId: record.runId, type: record.type, startTime: record.startTime };
    });
  }
}
