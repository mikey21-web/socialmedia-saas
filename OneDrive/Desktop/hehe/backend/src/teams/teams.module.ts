import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TeamsService } from './teams.service';

@Module({
  imports: [SubscriptionsModule],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
