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
import { MediaService, UploadedFile as MediaUploadedFile } from './media.service';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async upload(
    @TeamId() teamId: string | undefined,
    @UploadedFile() file: MediaUploadedFile,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    if (!file) throw new BadRequestException('No file provided');
    return this.mediaService.uploadFile(teamId, file);
  }

  @Post('generate')
  async generateImage(
    @TeamId() teamId: string | undefined,
    @Body() body: { prompt: string },
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    if (!body.prompt) throw new BadRequestException('prompt required');
    return this.mediaService.generateImage(teamId, body.prompt);
  }

  @Post('generate-video')
  async generateVideo(
    @TeamId() teamId: string | undefined,
    @Body() body: { prompt: string; duration?: number },
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    if (!body.prompt) throw new BadRequestException('prompt required');
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
