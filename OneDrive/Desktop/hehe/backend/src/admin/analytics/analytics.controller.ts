import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminGuard } from '../admin.guard';
import { AdminAnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller(['admin/analytics', 'api/admin/analytics'])
export class AdminAnalyticsController {
  constructor(private readonly analytics: AdminAnalyticsService) {}

  @Get('overview')
  overview() {
    return this.analytics.getOverview();
  }

  @Get('platform-breakdown')
  platformBreakdown() {
    return this.analytics.getPlatformBreakdown();
  }

  @Get('top-customers')
  topCustomers() {
    return this.analytics.getTopCustomers();
  }
}
