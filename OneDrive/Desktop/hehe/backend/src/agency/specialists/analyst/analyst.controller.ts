import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt.guard';
import { PlanLimit, PlanLimitGuard } from '../../../common/guards/plan-limit.guard';
import { AnalystService } from './analyst.service';

@Controller('agency/analyst')
@UseGuards(JwtAuthGuard, PlanLimitGuard)
export class AnalystController {
  constructor(private readonly analyst: AnalystService) {}

  @Get('weekly-report')
  @PlanLimit('reports')
  weeklyReport(@Req() req: { user: { team_id: string } }) {
    return this.analyst.generateWeeklyReport(req.user.team_id);
  }

  @Get('daily-insight')
  @PlanLimit('reports')
  dailyInsight(@Req() req: { user: { team_id: string } }) {
    return this.analyst.generateDailyInsight(req.user.team_id);
  }

  @Get('winning-patterns')
  winningPatterns(@Req() req: { user: { team_id: string } }) {
    return this.analyst.findWinningPatterns(req.user.team_id);
  }

  @Get('reports')
  reports(
    @Req() req: { user: { team_id: string } },
    @Query('type') type?: string,
  ) {
    return this.analyst.listReports(req.user.team_id, type);
  }

  @Post('competitors')
  analyzeCompetitors(
    @Req() req: { user: { team_id: string } },
    @Body() body: { competitorHandles: { platform: string; handle: string }[] },
  ) {
    return this.analyst.analyzeCompetitors({ teamId: req.user.team_id, ...body });
  }
}
