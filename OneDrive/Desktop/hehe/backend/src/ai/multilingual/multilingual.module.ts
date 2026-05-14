import { Module } from '@nestjs/common';
import { LlmModule } from '../../agents/llm/llm.module';
import { MultilingualController } from './multilingual.controller';
import { MultilingualService } from './multilingual.service';

@Module({
  imports: [LlmModule],
  controllers: [MultilingualController],
  providers: [MultilingualService],
  exports: [MultilingualService],
})
export class MultilingualModule {}
