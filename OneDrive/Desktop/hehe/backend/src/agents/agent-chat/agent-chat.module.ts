import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { BrandModule } from '../../brand/brand.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { ContentAgentModule } from '../content/content.module';
import { TrendAgentModule } from '../trend/trend.module';
import { CompetitorAgentModule } from '../competitor/competitor.module';
import { LlmModule } from '../llm/llm.module';
import { AgentChatService } from './agent-chat.service';
import { AgentChatController } from './agent-chat.controller';

@Module({
  imports: [
    PrismaModule,
    AnalyticsModule,
    BrandModule,
    NotificationsModule,
    ContentAgentModule,
    TrendAgentModule,
    CompetitorAgentModule,
    LlmModule,
  ],
  providers: [AgentChatService],
  controllers: [AgentChatController],
  exports: [AgentChatService],
})
export class AgentChatModule {}
