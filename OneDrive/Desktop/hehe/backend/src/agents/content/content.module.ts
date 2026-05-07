import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { LlmService } from '../llm/llm.service';
import { BrandModule } from '../../brand/brand.module';

@Module({
  imports: [BrandModule],
  controllers: [ContentController],
  providers: [ContentService, LlmService],
  exports: [ContentService, LlmService],
})
export class ContentAgentModule {}
