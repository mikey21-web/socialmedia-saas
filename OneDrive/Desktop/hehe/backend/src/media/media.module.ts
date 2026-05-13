import { Module } from '@nestjs/common';
import { PlanLimitGuard } from '../common/guards/plan-limit.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../agents/llm/llm.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { HyperframesService } from './hyperframes.service';
import { HyperframesExtendedService } from './hyperframes-extended.service';
import { HyperframesExtendedController } from './hyperframes-extended.controller';
import { R2StorageService } from './r2-storage.service';
import { VideoController } from './video.controller';
import { VideoPipelineService } from './video-pipeline.service';
import { VideoProcessorService } from './video-processor.service';

@Module({
  imports: [PrismaModule, LlmModule],
  controllers: [MediaController, VideoController, HyperframesExtendedController],
  providers: [
    MediaService,
    HyperframesService,
    HyperframesExtendedService,
    PlanLimitGuard,
    R2StorageService,
    VideoPipelineService,
    VideoProcessorService,
  ],
  exports: [MediaService, R2StorageService, VideoPipelineService, VideoProcessorService, HyperframesExtendedService],
})
export class MediaModule {}
})
export class MediaModule {}
