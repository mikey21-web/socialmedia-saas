import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
}
