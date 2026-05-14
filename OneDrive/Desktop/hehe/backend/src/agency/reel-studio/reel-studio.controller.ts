import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { ReelTemplateService, ListTemplatesQuery } from './reel-template.service';
import { ReelScriptService, GenerateScriptInput } from './reel-script.service';
import { ReelCalendarService, GenerateCalendarInput } from './reel-calendar.service';
import { TrendingAudioService } from './trending-audio.service';

@Controller('agency/reel-studio')
@UseGuards(JwtAuthGuard)
export class ReelStudioController {
  constructor(
    private readonly templates: ReelTemplateService,
    private readonly scripts: ReelScriptService,
    private readonly calendar: ReelCalendarService,
    private readonly audio: TrendingAudioService,
  ) {}

  /* ───────────── Templates ───────────── */

  @Get('templates')
  listTemplates(@Query() query: ListTemplatesQuery) {
    return this.templates.list({
      ...query,
      limit: query.limit ? Number(query.limit) : undefined,
    });
  }

  @Get('templates/:id')
  getTemplate(@Param('id') id: string) {
    return this.templates.getById(id);
  }

  @Get('templates/by-slug/:slug')
  getTemplateBySlug(@Param('slug') slug: string) {
    return this.templates.getBySlug(slug);
  }

  @Get('templates/curated/:vertical')
  curated(@Param('vertical') vertical: string, @Query('goal') goal?: string) {
    return this.templates.curatedPicks(vertical, goal);
  }

  @Get('verticals')
  verticals() {
    return this.templates.listVerticalsWithCounts();
  }

  @Get('categories')
  categories() {
    return this.templates.listCategoriesWithCounts();
  }

  /* ───────────── Scripts ───────────── */

  @Post('scripts/generate')
  generateScript(
    @Req() req: { user: { team_id: string } },
    @Body() body: Omit<GenerateScriptInput, 'teamId'>,
  ) {
    return this.scripts.generate({ ...body, teamId: req.user.team_id });
  }

  @Get('scripts')
  listScripts(@Req() req: { user: { team_id: string } }, @Query('status') status?: string) {
    return this.scripts.list(req.user.team_id, status);
  }

  @Get('scripts/:id')
  getScript(@Req() req: { user: { team_id: string } }, @Param('id') id: string) {
    return this.scripts.getById(req.user.team_id, id);
  }

  @Patch('scripts/:id/status')
  updateScriptStatus(
    @Req() req: { user: { team_id: string } },
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.scripts.updateStatus(req.user.team_id, id, body.status);
  }

  @Post('scripts/:id/link-video/:videoProjectId')
  linkVideoProject(
    @Req() req: { user: { team_id: string } },
    @Param('id') id: string,
    @Param('videoProjectId') videoProjectId: string,
  ) {
    return this.scripts.linkVideoProject(req.user.team_id, id, videoProjectId);
  }

  @Delete('scripts/:id')
  deleteScript(@Req() req: { user: { team_id: string } }, @Param('id') id: string) {
    return this.scripts.delete(req.user.team_id, id);
  }

  /* ───────────── Calendar ───────────── */

  @Post('calendar/generate')
  generateCalendar(
    @Req() req: { user: { team_id: string } },
    @Body() body: Omit<GenerateCalendarInput, 'teamId'>,
  ) {
    return this.calendar.generate({ ...body, teamId: req.user.team_id });
  }

  @Get('calendar')
  listCalendars(@Req() req: { user: { team_id: string } }) {
    return this.calendar.list(req.user.team_id);
  }

  @Get('calendar/current')
  currentCalendar(
    @Req() req: { user: { team_id: string } },
    @Query('vertical') vertical: string,
    @Query('language') language?: string,
  ) {
    const now = new Date();
    return this.calendar.getOrGenerate({
      teamId: req.user.team_id,
      vertical,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      language,
    });
  }

  /* ───────────── Trending Audio ───────────── */

  @Get('audio')
  listAudio(
    @Query('platform') platform?: string,
    @Query('mood') mood?: string,
    @Query('vertical') vertical?: string,
    @Query('language') language?: string,
    @Query('limit') limit?: string,
  ) {
    return this.audio.list({
      platform,
      mood,
      vertical,
      language,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('audio/:id')
  getAudio(@Param('id') id: string) {
    return this.audio.getById(id);
  }
}
