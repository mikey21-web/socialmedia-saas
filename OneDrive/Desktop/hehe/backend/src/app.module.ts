import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { SentryModule } from '@sentry/nestjs/setup';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { RedisProvider } from './common/redis.provider';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { MediaModule } from './media/media.module';
import { PlatformsModule } from './platforms/platforms.module';
import { PublishingModule } from './publishing/publishing.module';
import { PostsModule } from './posts/posts.module';
import { PostsetsModule } from './postsets/postsets.module';
import { PrismaModule } from './prisma/prisma.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TeamsModule } from './teams/teams.module';
import { TemporalModule } from './temporal/temporal.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ThirdPartyModule } from './thirdparty/thirdparty.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        if (!process.env.REDIS_URL) {
          console.warn('REDIS_URL is not configured, falling back to redis://localhost:6379');
        }
        const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
        return {
          throttlers: [{ ttl: 60000, limit: 120 }],
          storage: new ThrottlerStorageRedisService(new Redis(redisUrl)),
        };
      },
    }),
    SentryModule.forRoot(),
    PrismaModule,
    TemporalModule,
    AuthModule,
    CommentsModule,
    MediaModule,
    PostsetsModule,
    PostsModule,
    PublishingModule,
    PlatformsModule,
    AnalyticsModule,
    WebhooksModule,
    SubscriptionsModule,
    TeamsModule,
    ThirdPartyModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }, RedisProvider],
  exports: [RedisProvider],
})
export class AppModule {}
