import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { RedisProvider } from '../common/redis.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { TemporalModule } from '../temporal/temporal.module';
import { AdminAnalyticsController } from './analytics/analytics.controller';
import { AdminAnalyticsService } from './analytics/analytics.service';
import { ApiUsageController } from './api-usage/api-usage.controller';
import { ApiUsageService } from './api-usage/api-usage.service';
import { AdminAuditController } from './audit/audit.controller';
import { AdminAuditService } from './audit/audit.service';
import { AdminBackupsController } from './backups/backups.controller';
import { AdminBackupsService } from './backups/backups.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminEmailTemplatesController } from './email-templates/email-templates.controller';
import { AdminEmailTemplatesService } from './email-templates/email-templates.service';
import { FeatureFlagsController } from './feature-flags/feature-flags.controller';
import { FeatureFlagsService } from './feature-flags/feature-flags.service';
import { AdminHealthController } from './health/health.controller';
import { AdminHealthService } from './health/health.service';
import { AdminPerformanceController } from './performance/performance.controller';
import { AdminPerformanceService } from './performance/performance.service';
import { AdminSecurityController } from './security/security.controller';
import { AdminSecurityService } from './security/security.service';
import { AdminSupportController } from './support/support.controller';
import { AdminSupportService } from './support/support.service';
import { AdminTeamsController } from './teams/teams.controller';
import { AdminTeamsService } from './teams/teams.service';
import { AdminWebhooksController } from './webhooks/webhooks.controller';
import { AdminWebhooksService } from './webhooks/webhooks.service';

@Module({
  imports: [PrismaModule, TemporalModule, EmailModule],
  controllers: [
    AdminController,
    AdminAnalyticsController,
    AdminHealthController,
    FeatureFlagsController,
    ApiUsageController,
    AdminWebhooksController,
    AdminAuditController,
    AdminSecurityController,
    AdminEmailTemplatesController,
    AdminSupportController,
    AdminTeamsController,
    AdminBackupsController,
    AdminPerformanceController,
  ],
  providers: [
    AdminService,
    AdminAnalyticsService,
    AdminHealthService,
    FeatureFlagsService,
    ApiUsageService,
    AdminWebhooksService,
    AdminAuditService,
    AdminSecurityService,
    AdminEmailTemplatesService,
    AdminSupportService,
    AdminTeamsService,
    AdminBackupsService,
    AdminPerformanceService,
    RedisProvider,
  ],
  exports: [FeatureFlagsService],
})
export class AdminModule {}
