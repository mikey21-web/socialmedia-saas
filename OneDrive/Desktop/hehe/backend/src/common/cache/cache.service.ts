import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis.provider';

/**
 * Lightweight Redis-backed cache wrapper with JSON serialization.
 * Falls back to no-op when Redis is unavailable.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Optional() @Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      this.logger.warn(`Cache get failed for ${key}: ${(err as Error)?.message}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      this.logger.warn(`Cache set failed for ${key}: ${(err as Error)?.message}`);
    }
  }

  async del(key: string | string[]): Promise<void> {
    if (!this.redis) return;
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length > 0) await this.redis.del(...keys);
    } catch (err) {
      this.logger.warn(`Cache del failed: ${(err as Error)?.message}`);
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.redis) return 0;
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      await this.redis.del(...keys);
      return keys.length;
    } catch (err) {
      this.logger.warn(`Cache invalidatePattern failed: ${(err as Error)?.message}`);
      return 0;
    }
  }

  /**
   * Cache-aside pattern: returns cached value or runs the loader and caches result.
   */
  async wrap<T>(key: string, loader: () => Promise<T>, ttlSeconds: number = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await loader();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}
