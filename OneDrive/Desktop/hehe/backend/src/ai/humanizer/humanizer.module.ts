import { Module } from '@nestjs/common';
import { LlmModule } from '../../agents/llm/llm.module';
import { HumanizerService } from './humanizer.service';
import { HumanizerController } from './humanizer.controller';

@Module({
  imports: [LlmModule],
  controllers: [HumanizerController],
  providers: [HumanizerService],
  exports: [HumanizerService],
})
export class HumanizerModule {}
