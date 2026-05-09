import { Module } from '@nestjs/common';
import { ContentAgentModule } from './content/content.module';
import { TrendAgentModule } from './trend/trend.module';
import { CompetitorAgentModule } from './competitor/competitor.module';
import { AutonomousModule } from './autonomous/autonomous.module';
import { AgentChatModule } from './agent-chat/agent-chat.module';

@Module({
  imports: [ContentAgentModule, TrendAgentModule, CompetitorAgentModule, AutonomousModule, AgentChatModule],
  exports: [ContentAgentModule, TrendAgentModule, CompetitorAgentModule, AutonomousModule, AgentChatModule],
})
export class AgentsModule {}
