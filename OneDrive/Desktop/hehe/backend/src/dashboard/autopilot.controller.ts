import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { AutopilotService } from './autopilot.service';

@UseGuards(JwtAuthGuard)
@Controller(['autopilot', 'api/autopilot'])
export class AutopilotController {
  constructor(private readonly autopilot: AutopilotService) {}

  @Get('status')
  status(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.autopilot.getStatus(req.user.team_id);
  }

  @Post('toggle')
  toggle(@Req() req: { user: AuthenticatedRequestUser }, @Body() body: { enabled: boolean }) {
    return this.autopilot.toggle(req.user.team_id, body.enabled);
  }
}
