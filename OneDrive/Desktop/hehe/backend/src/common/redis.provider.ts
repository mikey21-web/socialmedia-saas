import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    const url = process.env.REDIS_URL;
    if (!url) {
      console.warn('REDIS_URL not set, Redis client will be lazy and may fail on use');
      return null;
    }
    return new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
  },
};
