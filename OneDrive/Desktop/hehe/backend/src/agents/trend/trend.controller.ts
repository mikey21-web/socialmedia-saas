import {
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
import { TrendService } from './trend.service';

@Controller('agents/trends')
@UseGuards(JwtAuthGuard)
export class TrendController {
  constructor(private readonly trendService: TrendService) {}

  @Get()
  getFeed(
    @Req() req: { user: AuthenticatedRequestUser },
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.trendService.getFeed(req.user.team_id, {
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Post('run')
  runNow(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.trendService.runForTeam(req.user.team_id);
  }

  @Post(':id/convert')
  convert(
    @Param('id') id: string,
    @Req() req: { user: AuthenticatedRequestUser },
  ) {
    return this.trendService.convertToPost(req.user.team_id, id);
  }

  @Post(':id/dismiss')
  dismiss(
    @Param('id') id: string,
    @Req() req: { user: AuthenticatedRequestUser },
  ) {
    return this.trendService.dismiss(req.user.team_id, id);
  }
}
