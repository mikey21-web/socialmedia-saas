import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TeamId } from '../common/decorators/team.decorator';
import { RssService } from './rss.service';

@UseGuards(JwtAuthGuard)
@Controller('rss')
export class RssController {
  constructor(private readonly rssService: RssService) {}

  @Get()
  listSources(@TeamId() teamId: string | undefined) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.rssService.listSources(teamId);
  }

  @Post()
  createSource(
    @TeamId() teamId: string | undefined,
    @Body() body: { url: string; name?: string; platforms: string[]; autoPublish?: boolean },
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.rssService.createSource(teamId, body);
  }

  @Delete(':id')
  deleteSource(
    @TeamId() teamId: string | undefined,
    @Param('id') id: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.rssService.deleteSource(teamId, id);
  }

  @Patch(':id/toggle')
  toggleSource(
    @TeamId() teamId: string | undefined,
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.rssService.toggleSource(teamId, id, body.isActive);
  }

  @Post(':id/sync')
  syncSource(
    @TeamId() teamId: string | undefined,
    @Param('id') id: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.rssService.syncSource(id, teamId);
  }
}
