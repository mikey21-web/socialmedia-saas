import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AgencyOrchestratorService } from './agency-orchestrator.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('agency/orchestrator')
@UseGuards(JwtAuthGuard)
export class AgencyOrchestratorController {
  constructor(
    private readonly orchestrator: AgencyOrchestratorService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Get('activity-feed')
  async activityFeed(
    @Req() req: { user: { team_id: string } },
    @Query('limit') limit?: string,
  ) {
    const teamId = req.user.team_id;
    const take = Math.min(Number(limit) || 50, 100);

    const logs = await this.prisma.agentRunLog.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return logs.map((log) => ({
      id: log.id,
      agent: log.agentRole,
      action: log.triggerType,
      status: log.status,
      durationMs: log.durationMs,
      tokensUsed: log.tokensUsed,
      costInr: log.costInr,
      timestamp: log.createdAt,
      input: log.input,
      output: log.output,
      error: log.errorMessage,
    }));
  }
}
