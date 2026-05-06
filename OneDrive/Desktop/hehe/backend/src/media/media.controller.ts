import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { MediaService, UploadedFile as MediaUploadedFile } from './media.service';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async upload(@UploadedFile() file: MediaUploadedFile) {
    if (!file) throw new BadRequestException('No file provided');
    this.mediaService.validateMimeType(file.mimetype);
    const url = await this.mediaService.uploadToS3(file);
    return { url };
  }

  @Post('generate')
  async generateImage(@Body() body: { prompt: string }) {
    if (!body.prompt) throw new BadRequestException('prompt required');
    const url = await this.mediaService.generateImage(body.prompt);
    return { url };
  }

  @Post('generate-video')
  async generateVideo(@Body() body: { prompt: string; duration?: number }) {
    if (!body.prompt) throw new BadRequestException('prompt required');
    const url = await this.mediaService.generateVideo(body.prompt, body.duration);
    return { url };
  }
}
