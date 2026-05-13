import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PlanLimit, PlanLimitGuard } from '../common/guards/plan-limit.guard';
import { HyperframesExtendedService, ExtendedTemplateId } from './hyperframes-extended.service';
import { HYPERFRAME_TEMPLATES, getTemplateById } from './hyperframe-templates';
import { R2StorageService } from './r2-storage.service';
import { nanoid } from 'nanoid';

@Controller('media/hyperframes')
@UseGuards(JwtAuthGuard, PlanLimitGuard)
export class HyperframesExtendedController {
  constructor(
    private readonly extended: HyperframesExtendedService,
    private readonly r2: R2StorageService,
  ) {}

  /**
   * List all 15 templates with their fields.
   */
  @Get('templates')
  listTemplates() {
    return HYPERFRAME_TEMPLATES;
  }

  /**
   * Get a specific template's metadata.
   */
  @Get('templates/:id')
  getTemplate(@Param('id') id: string) {
    const tpl = getTemplateById(id);
    if (!tpl) throw new BadRequestException(`Unknown template: ${id}`);
    return tpl;
  }

  /**
   * Render an extended template (the 11 archetypes from Open Design).
   * Body: { templateId, data, format }
   */
  @Post('render-extended')
  @PlanLimit('ai_images')
  async renderExtended(
    @Req() req: { user: { team_id: string } },
    @Body()
    body: {
      templateId: ExtendedTemplateId;
      data: Record<string, unknown>;
      format?: 'story' | 'square' | 'landscape';
    },
  ) {
    const tpl = getTemplateById(body.templateId);
    if (!tpl) throw new BadRequestException(`Unknown template: ${body.templateId}`);

    const format = body.format ?? tpl.recommendedFormat;
    const buffer = await this.extended.render(
      body.templateId as ExtendedTemplateId,
      body.data,
      format,
      tpl.durationSec,
    );

    const key = `hyperframes/${req.user.team_id}/${body.templateId}-${nanoid()}.mp4`;
    const url = await this.r2.upload(key, buffer, 'video/mp4');

    return {
      url,
      templateId: body.templateId,
      format,
      durationSec: tpl.durationSec,
    };
  }
}
