import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { VideoPipelineService, UploadVideoDto } from './video-pipeline.service';

@Controller('media/video-projects')
@UseGuards(JwtAuthGuard)
export class VideoController {
  constructor(private readonly pipeline: VideoPipelineService) {}

  @Post()
  create(@Req() req: { user: { team_id: string } }, @Body() dto: UploadVideoDto) {
    return this.pipeline.createProject(req.user.team_id, dto);
  }

  @Get()
  list(@Req() req: { user: { team_id: string } }) {
    return this.pipeline.listProjects(req.user.team_id);
  }

  @Get('formats')
  formats() {
    return this.pipeline.getOutputFormats();
  }

  @Get(':id')
  get(@Req() req: { user: { team_id: string } }, @Param('id') id: string) {
    return this.pipeline.getProject(req.user.team_id, id);
  }

  @Post(':id/hooks')
  hooks(@Req() req: { user: { team_id: string } }, @Param('id') id: string) {
    return this.pipeline.suggestHooks(req.user.team_id, id);
  }

  @Get(':id/music')
  music(@Req() req: { user: { team_id: string } }, @Param('id') id: string) {
    return this.pipeline.suggestMusicTracks(req.user.team_id, id);
  }
}
