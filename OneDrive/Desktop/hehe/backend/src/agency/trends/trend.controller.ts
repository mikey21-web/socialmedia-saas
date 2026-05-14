import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { TrendMonitorService } from './trend-monitor.service';
import { GoogleTrendsService } from './google-trends.service';

@Controller('agency/trends')
@UseGuards(JwtAuthGuard)
export class TrendController {
  constructor(
    private readonly trendMonitor: TrendMonitorService,
    private readonly googleTrends: GoogleTrendsService,
  ) {}

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

  @Get('google/daily')
  googleDaily(@Query('geo') geo?: string) {
    return this.googleTrends.getDailyTrending(geo ?? 'IN');
  }

  @Get('google/realtime')
  googleRealtime(@Query('geo') geo?: string, @Query('category') category?: string) {
    return this.googleTrends.getRealTimeTrending(geo ?? 'IN', category ?? 'all');
  }

  @Get('google/interest/:keyword')
  googleInterest(@Param('keyword') keyword: string, @Query('geo') geo?: string) {
    return this.googleTrends.getInterestOverTime(keyword, geo ?? 'IN');
  }

  @Get('google/related/:keyword')
  googleRelated(@Param('keyword') keyword: string, @Query('geo') geo?: string) {
    return this.googleTrends.getRelatedQueries(keyword, geo ?? 'IN');
  }

  @Post('scan')
  triggerScan() {
    return this.trendMonitor.scanAllSources();
  }
}
