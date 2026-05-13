import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { BossAgentService } from './boss-agent.service';

@Controller('agency/boss')
@UseGuards(JwtAuthGuard)
export class BossAgentController {
  constructor(private readonly boss: BossAgentService) {}

  @Post('run')
  runCycle(@Req() req: { user: { team_id: string } }) {
    return this.boss.runIntelligentCycle(req.user.team_id);
  }

  @Get('thoughts')
  getThoughts(@Req() req: { user: { team_id: string } }) {
    return this.boss.getLiveThoughts(req.user.team_id);
  }
}
