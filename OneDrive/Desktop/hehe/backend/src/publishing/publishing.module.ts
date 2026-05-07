import { Module } from '@nestjs/common';
import { PlatformsModule } from '../platforms/platforms.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LinkedinPublisher } from './publishers/linkedin.publisher';
import { TwitterPublisher } from './publishers/twitter.publisher';
import { PublishingSchedulerService } from './scheduler.service';
import { PublishingService } from './publishing.service';

@Module({
  imports: [PrismaModule, PlatformsModule],
  providers: [PublishingService, PublishingSchedulerService, TwitterPublisher, LinkedinPublisher],
  exports: [PublishingService, PublishingSchedulerService],
})
export class PublishingModule {}
