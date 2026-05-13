import { Module } from '@nestjs/common';
import { LlmModule } from '../../agents/llm/llm.module';
import { CritiqueService } from './critique.service';
import { CritiqueController } from './critique.controller';

@Module({
  imports: [LlmModule],
  controllers: [CritiqueController],
  providers: [CritiqueService],
  exports: [CritiqueService],
})
export class CritiqueModule {}
