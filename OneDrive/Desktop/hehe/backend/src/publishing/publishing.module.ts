import { Module } from '@nestjs/common';
import { PublishingSchedulerService } from './scheduler.service';
import { PublishingService } from './publishing.service';

@Module({
  providers: [PublishingService, PublishingSchedulerService],
  exports: [PublishingService, PublishingSchedulerService],
})
export class PublishingModule {}
