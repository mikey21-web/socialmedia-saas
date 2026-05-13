import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamsModule } from '../teams/teams.module';
import { PlatformsModule } from '../platforms/platforms.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { CampaignsService } from './campaigns.service';
import { AnalyticsExportService } from './export.service';
import { MetricsService } from './metrics.service';
import { PlatformMetricsFetcher } from './platform-metrics-fetcher.service';
import { RoiController } from './roi.controller';
import { RoiService } from './roi.service';
import { LearningLoopService } from './learning-loop.service';

@Module({
  imports: [PrismaModule, TeamsModule, PlatformsModule, ScheduleModule.forRoot()],
  controllers: [AnalyticsController, RoiController],
  providers: [AnalyticsService, AnalyticsExportService, MetricsService, PlatformMetricsFetcher, CampaignsService, RoiService, LearningLoopService, SubscriptionGuard],
  exports: [AnalyticsService, AnalyticsExportService, MetricsService, PlatformMetricsFetcher, CampaignsService, RoiService, LearningLoopService],
})
export class AnalyticsModule {}
