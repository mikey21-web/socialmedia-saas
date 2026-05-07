import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { LlmService } from '../agents/llm/llm.service';

@Module({
  controllers: [RecommendationsController],
  providers: [RecommendationsService, LlmService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}