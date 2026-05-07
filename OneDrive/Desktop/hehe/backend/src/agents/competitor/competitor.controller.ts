import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AuthenticatedRequestUser } from '../../common/interfaces/authenticated-request-user.interface';
import { CompetitorService } from './competitor.service';

@Controller('agents/competitors')
@UseGuards(JwtAuthGuard)
export class CompetitorController {
  constructor(private readonly competitorService: CompetitorService) {}

  @Get('digest')
  getDigest(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.competitorService.getDigest(req.user.team_id);
  }

  @Get('feed')
  getFeed(
    @Req() req: { user: AuthenticatedRequestUser },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.competitorService.getFeed(req.user.team_id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });
  }

  @Post('run')
  runNow(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.competitorService.fetchAndSnapshotCompetitors(req.user.team_id);
  }

  @Post(':id/snapshot')
  addSnapshot(
    @Param('id') id: string,
    @Req() req: { user: AuthenticatedRequestUser },
    @Body()
    body: {
      platform: string;
      topPosts: Array<{ content: string; likes?: number; comments?: number }>;
    },
  ) {
    return this.competitorService.manualSnapshot(
      req.user.team_id,
      id,
      body.platform,
      body.topPosts,
    );
  }
}
