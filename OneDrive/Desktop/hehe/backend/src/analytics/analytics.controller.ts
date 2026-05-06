import { BadRequestException, Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TeamId } from '../common/decorators/team.decorator';
import { SubscriptionFeatureLimit } from '../common/decorators/subscription-feature.decorator';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

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
}
