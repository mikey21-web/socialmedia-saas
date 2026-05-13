import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BrandVoiceModule } from '../brand-voice/brand-voice.module';
import { LlmModule } from '../agents/llm/llm.module';
import { HumanizerModule } from '../ai/humanizer/humanizer.module';
import { CritiqueModule } from '../ai/critique/critique.module';
import { MediaModule } from '../media/media.module';
import { CarouselController } from './carousel.controller';
import { CarouselService } from './carousel.service';
import { HtmlGeneratorService } from './html-generator.service';
import { PlaywrightExporterService } from './playwright-exporter.service';

@Module({
  imports: [PrismaModule, BrandVoiceModule, LlmModule, HumanizerModule, CritiqueModule, MediaModule],
  controllers: [CarouselController],
  providers: [CarouselService, HtmlGeneratorService, PlaywrightExporterService],
  exports: [CarouselService],
})
export class CarouselModule {}
