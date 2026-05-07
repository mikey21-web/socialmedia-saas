import { BadRequestException, Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TeamId } from '../common/decorators/team.decorator';
import { SubscriptionFeatureLimit } from '../common/decorators/subscription-feature.decorator';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { AnalyticsService } from './analytics.service';
import { AnalyticsExportService } from './export.service';

@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly analyticsExportService: AnalyticsExportService,
  ) {}

  @Get('posts/:id')
  @SubscriptionFeatureLimit('analytics')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  getPostMetrics(
    @Param('id') postId: string,
    @Req() req: { user: AuthenticatedRequestUser },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getMetrics(
      postId,
      req.user.team_id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('team')
  @SubscriptionFeatureLimit('analytics')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  getTeamStats(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.analyticsService.getTeamStats(req.user.team_id);
  }

  @Get('smart-suggestions')
  @SubscriptionFeatureLimit('analytics')
  getSmartSuggestions(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.analyticsService.getSmartSuggestions(req.user.team_id);
  }

  @Get('last-updated')
  getLastMetricsUpdate(@TeamId() teamId: string | undefined) {
    if (!teamId) {
      throw new BadRequestException('Missing team context');
    }
    return this.analyticsService.getLastMetricsUpdate(teamId);
  }

  @Get('summary')
  @SubscriptionFeatureLimit('analytics')
  getSummary(
    @TeamId() teamId: string | undefined,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('teamId') requestedTeamId?: string,
  ) {
    if (!teamId) {
      throw new BadRequestException('Missing team context');
    }
    return this.analyticsService.getSummary({
      teamId,
      requestedTeamId,
      from,
      to,
    });
  }

  @Get('export')
  @SubscriptionFeatureLimit('analytics')
  async exportAnalytics(
    @TeamId() teamId: string | undefined,
    @Query('type') type: 'posts' | 'trends',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    if (!teamId) {
      throw new BadRequestException('Missing team context');
    }
    const result = await this.analyticsExportService.export(teamId, type, startDate, endDate);
    res?.setHeader('Content-Type', 'text/csv');
    res?.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return result.csv;
  }

  @Get('platform-roi')
  @SubscriptionFeatureLimit('analytics')
  async getPlatformROI(
    @TeamId() teamId: string | undefined,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.analyticsService.getPlatformROI(
      teamId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('best-posting-times')
  @SubscriptionFeatureLimit('analytics')
  async getBestPostingTimes(@TeamId() teamId: string | undefined) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.analyticsService.getBestPostingTimes(teamId);
  }

  @Get('content-trends')
  @SubscriptionFeatureLimit('analytics')
  async getContentTrends(@TeamId() teamId: string | undefined) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.analyticsService.getContentPerformanceTrends(teamId);
  }
}
