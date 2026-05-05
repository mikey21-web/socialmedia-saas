import { Injectable } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class TeamsService {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  getTeamPlan(teamId: string) {
    return this.subscriptionsService.getTeamPlan(teamId);
  }

  getDailyPostCount(teamId: string) {
    return this.subscriptionsService.getDailyPostCount(teamId);
  }

  getMonthlyAnalyticsEventCount(teamId: string) {
    return this.subscriptionsService.getMonthlyAnalyticsEventCount(teamId);
  }
}
