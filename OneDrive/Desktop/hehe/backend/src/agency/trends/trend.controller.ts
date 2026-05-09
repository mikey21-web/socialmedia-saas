import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { TrendMonitorService } from './trend-monitor.service';

@Controller('agency/trends')
@UseGuards(JwtAuthGuard)
export class TrendController {
  constructor(private readonly trendMonitor: TrendMonitorService) {}

  @Get('relevant')
  getRelevant(@Req() req: { user: { team_id: string } }) {
    return this.trendMonitor.getRelevantTrends(req.user.team_id);
  }

  @Post('use/:trendId')
  useTrend(
    @Param('trendId') trendId: string,
    @Req() req: { user: { team_id: string } },
    @Query('brandVoiceId') brandVoiceId: string,
  ) {
    return this.trendMonitor.generateContentFromTrend({
      trendSignalId: trendId,
      teamId: req.user.team_id,
      brandVoiceId,
    });
  }

  @Get('feed')
  feed(@Query('limit') limit?: string) {
    return this.trendMonitor.getTrendFeed(limit ? parseInt(limit, 10) : 50);
  }
}
