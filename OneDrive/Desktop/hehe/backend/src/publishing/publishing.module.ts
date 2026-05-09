import { Module } from '@nestjs/common';
import { PlatformsModule } from '../platforms/platforms.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FacebookPublisher } from './publishers/facebook.publisher';
import { InstagramPublisher } from './publishers/instagram.publisher';
import { LinkedinPublisher } from './publishers/linkedin.publisher';
import { TwitterPublisher } from './publishers/twitter.publisher';
import { PublishingSchedulerService } from './scheduler.service';
import { PublishingService } from './publishing.service';

@Module({
  imports: [PrismaModule, PlatformsModule],
  providers: [
    PublishingService,
    PublishingSchedulerService,
    TwitterPublisher,
    LinkedinPublisher,
    InstagramPublisher,
    FacebookPublisher,
  ],
  exports: [PublishingService, PublishingSchedulerService],
})
export class PublishingModule {}
