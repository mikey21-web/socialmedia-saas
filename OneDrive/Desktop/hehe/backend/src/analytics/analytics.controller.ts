import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TeamId } from '../common/decorators/team.decorator';
import { SubscriptionFeatureLimit } from '../common/decorators/subscription-feature.decorator';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { AnalyticsService } from './analytics.service';
import { CampaignsService } from './campaigns.service';
import { AnalyticsExportService } from './export.service';
import { LearningLoopService } from './learning-loop.service';

@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly analyticsExportService: AnalyticsExportService,
    private readonly campaignsService: CampaignsService,
    private readonly learningLoop: LearningLoopService,
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

  @Get('follower-growth')
  @SubscriptionFeatureLimit('analytics')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getFollowerGrowth(
    @TeamId() teamId: string | undefined,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.analyticsService.getFollowerGrowth(
      teamId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('video-metrics')
  @SubscriptionFeatureLimit('analytics')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getVideoMetrics(
    @TeamId() teamId: string | undefined,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.analyticsService.getVideoMetrics(
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

  @Get('posting-heatmap')
  @SubscriptionFeatureLimit('analytics')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getPostingHeatmap(@TeamId() teamId: string | undefined) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.analyticsService.getPostingHeatmap(teamId);
  }

  @Get('engagement-benchmarks')
  @SubscriptionFeatureLimit('analytics')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getEngagementBenchmarks(
    @TeamId() teamId: string | undefined,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.analyticsService.getEngagementBenchmarks(
      teamId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Post('campaigns')
  @SubscriptionFeatureLimit('analytics')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async createCampaign(
    @TeamId() teamId: string | undefined,
    @Body() body: { name: string; description?: string; startDate?: string; endDate?: string },
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.campaignsService.createCampaign(teamId, body);
  }

  @Get('campaigns')
  @SubscriptionFeatureLimit('analytics')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listCampaigns(@TeamId() teamId: string | undefined) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.campaignsService.listCampaigns(teamId);
  }

  @Get('campaigns/:id/stats')
  @SubscriptionFeatureLimit('analytics')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getCampaignStats(
    @TeamId() teamId: string | undefined,
    @Param('id') campaignId: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.campaignsService.getCampaignStats(campaignId, teamId);
  }

  @Patch('campaigns/:id/posts')
  @SubscriptionFeatureLimit('analytics')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async assignPostToCampaign(
    @TeamId() teamId: string | undefined,
    @Param('id') campaignId: string,
    @Body() body: { postId: string },
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.campaignsService.assignPostToCampaign(body.postId, campaignId, teamId);
  }

  @Get('virality')
  @SubscriptionFeatureLimit('analytics')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getVirality(
    @TeamId() teamId: string | undefined,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.analyticsService.getViralityScores(
      teamId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('demographics')
  @SubscriptionFeatureLimit('analytics')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getDemographics(
    @TeamId() teamId: string | undefined,
    @Query('platform') platform?: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.analyticsService.getDemographics(teamId, platform);
  }

  @Get('content-trends')
  @SubscriptionFeatureLimit('analytics')
  async getContentTrends(@TeamId() teamId: string | undefined) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.analyticsService.getContentPerformanceTrends(teamId);
  }

  // ─── Learning Loop ──────────────────────────────────────────────────────────

  @Get('learning-loop/insights')
  @SubscriptionFeatureLimit('analytics')
  async getLearningInsights(@TeamId() teamId: string | undefined) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.learningLoop.getTeamInsights(teamId);
  }

  @Post('learning-loop/analyze')
  @SubscriptionFeatureLimit('analytics')
  async triggerAnalysis(@TeamId() teamId: string | undefined) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.learningLoop.analyzeTeamPatterns(teamId);
  }
}
