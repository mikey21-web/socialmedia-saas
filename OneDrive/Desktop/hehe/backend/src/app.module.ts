import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { PlatformsModule } from './platforms/platforms.module';
import { PublishingModule } from './publishing/publishing.module';
import { PostsModule } from './posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TeamsModule } from './teams/teams.module';
import { TemporalModule } from './temporal/temporal.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 120,
    }]),
    PrismaModule,
    TemporalModule,
    AuthModule,
    PostsModule,
    PublishingModule,
    PlatformsModule,
    AnalyticsModule,
    WebhooksModule,
    SubscriptionsModule,
    TeamsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
