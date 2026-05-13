import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt.guard';
import { UgcVideoService, UgcVideoBrief } from './ugc-video.service';

@Controller('agency/ugc-video')
@UseGuards(JwtAuthGuard)
export class UgcVideoController {
  constructor(private readonly ugc: UgcVideoService) {}

  @Post('generate')
  generate(
    @Req() req: { user: { team_id: string } },
    @Body() body: Omit<UgcVideoBrief, 'teamId'>,
  ) {
    if (!body.topic?.trim()) throw new BadRequestException('topic required');
    if (!body.platform) throw new BadRequestException('platform required');
    if (!body.videoStyle) throw new BadRequestException('videoStyle required');
    return this.ugc.generateUgcVideo({ teamId: req.user.team_id, ...body });
  }

  @Post('script')
  scriptOnly(
    @Req() req: { user: { team_id: string } },
    @Body() body: Omit<UgcVideoBrief, 'teamId'>,
  ) {
    if (!body.topic?.trim()) throw new BadRequestException('topic required');
    return this.ugc.generateScript({ teamId: req.user.team_id, ...body });
  }

  @Get('avatar-status/:jobId')
  checkAvatarStatus(
    @Req() req: { user: { team_id: string } },
    @Param('jobId') jobId: string,
  ) {
    return this.ugc.checkAvatarStatus(req.user.team_id, jobId);
  }
}
