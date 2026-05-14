import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../agents/llm/llm.module';
import { MediaModule } from '../media/media.module';
import { PublishingModule } from '../publishing/publishing.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { HumanizerModule } from '../ai/humanizer/humanizer.module';
import { AgentRunLoggerService } from './agent-run-logger.service';
import { StrategistService } from './specialists/strategist/strategist.service';
import { StrategistController } from './specialists/strategist/strategist.controller';
import { CopywriterService } from './specialists/copywriter/copywriter.service';
import { CopywriterController } from './specialists/copywriter/copywriter.controller';
import { DesignerService } from './specialists/designer/designer.service';
import { DesignerController } from './specialists/designer/designer.controller';
import { AnalystService } from './specialists/analyst/analyst.service';
import { AnalystController } from './specialists/analyst/analyst.controller';
import { EngagementManagerService } from './specialists/engagement-manager/engagement-manager.service';
import { EngagementManagerController } from './specialists/engagement-manager/engagement-manager.controller';
import { CompetitorWatcherService } from './specialists/competitor-watcher/competitor-watcher.service';
import { BrandVoiceTrainerService } from './brand-voice/brand-voice-trainer.service';
import { BrandVoiceController } from './brand-voice/brand-voice.controller';
import { TrendMonitorService } from './trends/trend-monitor.service';
import { GoogleTrendsService } from './trends/google-trends.service';
import { TrendController } from './trends/trend.controller';
import { AgencyOrchestratorService } from './orchestrator/agency-orchestrator.service';
import { AgencyOrchestratorController } from './orchestrator/agency-orchestrator.controller';
import { ReplicateModule } from '../ai/replicate/replicate.module';
import { ImageAdapterService } from './specialists/designer/image-adapter.service';
import { BossAgentService } from './boss/boss-agent.service';
import { BossAgentController } from './boss/boss-agent.controller';
import { UgcVideoService } from './specialists/ugc-video/ugc-video.service';
import { UgcVideoController } from './specialists/ugc-video/ugc-video.controller';
import { ClientPortalService } from './client-portal/client-portal.service';
import { ClientPortalController } from './client-portal/client-portal.controller';

@Module({
  imports: [
    PrismaModule,
    LlmModule,
    MediaModule,
    PublishingModule,
    AnalyticsModule,
    NotificationsModule,
    HumanizerModule,
    ReplicateModule,
  ],
  controllers: [
    AgencyOrchestratorController,
    BossAgentController,
    BrandVoiceController,
    StrategistController,
    CopywriterController,
    DesignerController,
    AnalystController,
    EngagementManagerController,
    TrendController,
    UgcVideoController,
    ClientPortalController,
  ],
  providers: [
    AgentRunLoggerService,
    AgencyOrchestratorService,
    BossAgentService,
    BrandVoiceTrainerService,
    StrategistService,
    CopywriterService,
    DesignerService,
    AnalystService,
    EngagementManagerService,
    CompetitorWatcherService,
    TrendMonitorService,
    GoogleTrendsService,
    ImageAdapterService,
    UgcVideoService,
    ClientPortalService,
  ],
  exports: [AgencyOrchestratorService, BossAgentService, ClientPortalService, CompetitorWatcherService],
})
export class AgencyModule {}
