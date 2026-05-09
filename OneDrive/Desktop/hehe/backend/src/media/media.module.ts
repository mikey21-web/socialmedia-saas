import { Module } from '@nestjs/common';
import { PlanLimitGuard } from '../common/guards/plan-limit.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { HyperframesService } from './hyperframes.service';
import { R2StorageService } from './r2-storage.service';

@Module({
  imports: [PrismaModule],
  controllers: [MediaController],
  providers: [MediaService, HyperframesService, PlanLimitGuard, R2StorageService],
  exports: [MediaService, R2StorageService],
})
export class MediaModule {}
