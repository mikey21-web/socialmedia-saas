import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../agents/llm/llm.module';
import { BrandVoiceService } from './brand-voice.service';
import { BrandVoiceExtractorService } from './brand-voice-extractor.service';
import { PaletteBuilderService } from './palette-builder.service';
import { BrandVoiceProfileController } from './brand-voice.controller';

@Module({
  imports: [PrismaModule, LlmModule],
  controllers: [BrandVoiceProfileController],
  providers: [BrandVoiceService, BrandVoiceExtractorService, PaletteBuilderService],
  exports: [BrandVoiceService, PaletteBuilderService],
})
export class BrandVoiceModule {}
