import { Controller, Get, Inject, Optional } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from './common/redis.provider';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {}

  @Get('health')
  async health(): Promise<{ status: string; db: string; redis: string; uptime: number }> {
    let db = 'ok';
    let redis = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'fail';
    }

    try {
      if (!this.redis) throw new Error('Redis not configured');
      await this.redis.ping();
    } catch {
      redis = 'fail';
    }

    return { status: db === 'ok' ? 'ok' : 'fail', db, redis, uptime: process.uptime() };
  }

  @Get()
  root(): { service: string; status: string } {
    return { service: 'postiz-competitor-api', status: 'ok' };
  }
}
