import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AgencyOrchestratorService } from './agency-orchestrator.service';

@Controller('agency/orchestrator')
@UseGuards(JwtAuthGuard)
export class AgencyOrchestratorController {
  constructor(private readonly orchestrator: AgencyOrchestratorService) {}

  @Post('run-now')
  runNow(@Req() req: { user: { team_id: string } }) {
    return this.orchestrator.runDailyCycleForTeam(req.user.team_id);
  }

  @Get('status')
  status(@Req() req: { user: { team_id: string } }) {
    return this.orchestrator.getStatus(req.user.team_id);
  }

  @Post('pause')
  pause(@Req() req: { user: { team_id: string } }) {
    return this.orchestrator.pauseTeam(req.user.team_id);
  }

  @Post('resume')
  resume(@Req() req: { user: { team_id: string } }) {
    return this.orchestrator.resumeTeam(req.user.team_id);
  }
}
