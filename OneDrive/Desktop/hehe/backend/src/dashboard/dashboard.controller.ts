import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller(['dashboard', 'api/dashboard'])
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  summary(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.dashboard.getSummary(req.user.team_id);
  }

  @Get('engagement')
  engagement(
    @Req() req: { user: AuthenticatedRequestUser },
    @Query('range') range: '7d' | '30d' | '90d' = '30d',
  ) {
    return this.dashboard.getEngagement(req.user.team_id, range);
  }

  @Get('insights')
  insights(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.dashboard.getInsights(req.user.team_id);
  }

  @Get('activity')
  activity(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.dashboard.getActivity(req.user.team_id);
  }
}
