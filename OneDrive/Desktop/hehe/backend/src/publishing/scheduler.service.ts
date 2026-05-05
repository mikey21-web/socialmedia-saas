import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PublishingService } from './publishing.service';

@Injectable()
export class PublishingSchedulerService {
  private readonly logger = new Logger(PublishingSchedulerService.name);

  constructor(private readonly publishingService: PublishingService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAndPublish() {
    if (process.env.DISABLE_NEST_SCHEDULER === 'true') {
      return [];
    }

    const workflowIds = await this.publishingService.publishDuePosts();
    if (workflowIds.length) {
      this.logger.log(`Started ${workflowIds.length} publish workflows`);
    }
    return workflowIds;
  }
}
