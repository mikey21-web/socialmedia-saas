import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TeamId } from '../common/decorators/team.decorator';
import { PlanLimit, PlanLimitGuard } from '../common/guards/plan-limit.guard';
import { MediaService, UploadedFile as MediaUploadedFile } from './media.service';

@UseGuards(JwtAuthGuard, PlanLimitGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('heygen/avatars')
  @UseGuards(JwtAuthGuard)
  async heygenAvatars(@TeamId() teamId: string | undefined) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.mediaService.heygenAvatars(teamId);
  }

  @Get('heygen/voices')
  @UseGuards(JwtAuthGuard)
  async heygenVoices(@TeamId() teamId: string | undefined) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.mediaService.heygenVoices(teamId);
  }

  @Post('heygen/start')
  @PlanLimit('ai_images')
  async heygenStart(
    @TeamId() teamId: string | undefined,
    @Body()
    body: {
      script: string;
      avatarId: string;
      voiceId: string;
      type: 'avatar' | 'talking_photo';
      aspectRatio: 'landscape' | 'story';
      captions: boolean;
    },
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    if (!body.script?.trim()) throw new BadRequestException('script required');
    if (body.script.length > 2000) throw new BadRequestException('script too long (max 2000 chars)');
    if (!body.avatarId) throw new BadRequestException('avatarId required');
    if (!body.voiceId) throw new BadRequestException('voiceId required');
    return this.mediaService.heygenStart(teamId, body);
  }

  @Get('heygen/status/:videoId')
  async heygenStatus(
    @TeamId() teamId: string | undefined,
    @Param('videoId') videoId: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    if (!videoId) throw new BadRequestException('videoId required');
    return this.mediaService.heygenCheckStatus(teamId, videoId);
  }

  @Post('heygen/generate')
  @PlanLimit('ai_images')
  async heygenGenerate(
    @TeamId() teamId: string | undefined,
    @Body()
    body: {
      script: string;
      avatarId: string;
      voiceId: string;
      type: 'avatar' | 'talking_photo';
      aspectRatio: 'landscape' | 'story';
      captions: boolean;
    },
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    if (!body.script?.trim()) throw new BadRequestException('script required');
    if (body.script.length > 2000) throw new BadRequestException('script too long (max 2000 chars)');
    if (!body.avatarId) throw new BadRequestException('avatarId required');
    if (!body.voiceId) throw new BadRequestException('voiceId required');
    return this.mediaService.heygenGenerate(teamId, body);
  }

  @Post('hyperframes/render')
  @PlanLimit('ai_images')
  async renderHyperframe(
    @TeamId() teamId: string | undefined,
    @Body()
    body: {
      templateId: 'quote-card' | 'announcement' | 'stat-card' | 'product-showcase';
      data: Record<string, string>;
      format: 'story' | 'square' | 'landscape';
    },
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    if (!body.templateId) throw new BadRequestException('templateId required');
    if (!body.data || typeof body.data !== 'object') throw new BadRequestException('data required');

    const ALLOWED = ['quote-card', 'announcement', 'stat-card', 'product-showcase'];
    if (!ALLOWED.includes(body.templateId))
      throw new BadRequestException('Invalid templateId');

    const FORMATS = ['story', 'square', 'landscape'];
    if (body.format && !FORMATS.includes(body.format))
      throw new BadRequestException('Invalid format');

    return this.mediaService.renderHyperframe(
      teamId,
      body.templateId,
      body.data,
      body.format ?? 'story',
    );
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }))
  async upload(
    @TeamId() teamId: string | undefined,
    @UploadedFile() file: MediaUploadedFile,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    if (!file) throw new BadRequestException('No file provided');
    return this.mediaService.uploadFile(teamId, file);
  }

  @Post('generate')
  @PlanLimit('ai_images')
  async generateImage(
    @TeamId() teamId: string | undefined,
    @Body() body: { prompt: string },
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    if (!body.prompt) throw new BadRequestException('prompt required');
    if (body.prompt.length > 1000) throw new BadRequestException('prompt too long');
    return this.mediaService.generateImage(teamId, body.prompt);
  }

  @Post('generate-video')
  @PlanLimit('ai_images')
  async generateVideo(
    @TeamId() teamId: string | undefined,
    @Body() body: { prompt: string; duration?: number },
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    if (!body.prompt) throw new BadRequestException('prompt required');
    if (body.prompt.length > 1000) throw new BadRequestException('prompt too long');
    if (body.duration !== undefined && (body.duration < 1 || body.duration > 60)) {
      throw new BadRequestException('invalid duration');
    }
    return this.mediaService.generateVideo(teamId, body.prompt, body.duration);
  }

  @Get('assets')
  listAssets(
    @TeamId() teamId: string | undefined,
    @Query('source') source?: string,
    @Query('tag') tag?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.mediaService.listAssets(teamId, {
      source,
      tag,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Delete('assets/:id')
  deleteAsset(
    @TeamId() teamId: string | undefined,
    @Param('id') id: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.mediaService.deleteAsset(teamId, id);
  }

  @Patch('assets/:id/tags')
  updateAssetTags(
    @TeamId() teamId: string | undefined,
    @Param('id') id: string,
    @Body() body: { action?: 'add' | 'remove'; tag?: string },
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    if (!body.tag) throw new BadRequestException('tag required');
    if (body.action === 'remove') {
      return this.mediaService.removeTag(teamId, id, body.tag);
    }
    return this.mediaService.addTag(teamId, id, body.tag);
  }
}
