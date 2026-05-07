import { Module } from '@nestjs/common';
import { ContentAgentModule } from './content/content.module';
import { TrendAgentModule } from './trend/trend.module';
import { CompetitorAgentModule } from './competitor/competitor.module';

@Module({
  imports: [ContentAgentModule, TrendAgentModule, CompetitorAgentModule],
  exports: [ContentAgentModule, TrendAgentModule, CompetitorAgentModule],
})
export class AgentsModule {}
