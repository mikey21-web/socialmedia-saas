import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamsModule } from '../teams/teams.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsExportService } from './export.service';
import { MetricsService } from './metrics.service';

@Module({
  imports: [PrismaModule, TeamsModule, ScheduleModule.forRoot()],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsExportService, MetricsService, SubscriptionGuard],
  exports: [AnalyticsService, AnalyticsExportService, MetricsService],
})
export class AnalyticsModule {}
