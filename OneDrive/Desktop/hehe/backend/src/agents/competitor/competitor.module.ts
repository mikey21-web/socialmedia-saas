import { Module } from '@nestjs/common';
import { BrandModule } from '../../brand/brand.module';
import { ContentAgentModule } from '../content/content.module';
import { CompetitorController } from './competitor.controller';
import { CompetitorService } from './competitor.service';

@Module({
  imports: [BrandModule, ContentAgentModule],
  controllers: [CompetitorController],
  providers: [CompetitorService],
  exports: [CompetitorService],
})
export class CompetitorAgentModule {}
