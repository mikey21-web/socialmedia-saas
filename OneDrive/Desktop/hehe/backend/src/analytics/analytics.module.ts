import { Module } from '@nestjs/common';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamsModule } from '../teams/teams.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [PrismaModule, TeamsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, SubscriptionGuard],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
