import { Controller, Get, Inject, Optional } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from './common/redis.provider';
import { CircuitBreakerService } from './common/circuit-breaker/circuit-breaker.service';
import { PrismaService } from './prisma/prisma.service';

interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'fail';
  db: 'ok' | 'fail';
  redis: 'ok' | 'fail' | 'not_configured';
  uptime: number;
  version: string;
  timestamp: string;
}

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
    @Optional() private readonly circuitBreaker?: CircuitBreakerService,
  ) {}

  @Get('health')
  async health(): Promise<HealthCheckResult> {
    let db: HealthCheckResult['db'] = 'ok';
    let redis: HealthCheckResult['redis'] = 'ok';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'fail';
    }

    if (!this.redis) {
      redis = 'not_configured';
    } else {
      try {
        await this.redis.ping();
      } catch {
        redis = 'fail';
      }
    }

    let status: HealthCheckResult['status'] = 'ok';
    if (db === 'fail') status = 'fail';
    else if (redis === 'fail') status = 'degraded';

    return {
      status,
      db,
      redis,
      uptime: process.uptime(),
      version: process.env.APP_VERSION ?? '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/live')
  liveness(): { status: 'alive' } {
    return { status: 'alive' };
  }

  @Get('health/ready')
  async readiness() {
    let dbOk = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    return {
      status: dbOk ? 'ready' : 'not_ready',
      db: dbOk,
    };
  }

  @Get('health/platforms')
  platformsHealth() {
    if (!this.circuitBreaker) {
      return { circuits: {} };
    }
    return { circuits: this.circuitBreaker.getAllStates() };
  }

  @Get()
  root(): { service: string; status: string } {
    return { service: 'postiz-competitor-api', status: 'ok' };
  }
}
