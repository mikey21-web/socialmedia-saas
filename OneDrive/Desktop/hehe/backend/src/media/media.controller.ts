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
import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { MediaService } from './media.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          const name = crypto.randomBytes(16).toString('hex');
          cb(null, `${name}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async upload(
    @Req() req: { user: AuthenticatedRequestUser },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    this.mediaService.validateMimeType(file.mimetype);
    const url = this.mediaService.getFileUrl(file.filename);
    return { url };
  }

  @Post('generate')
  async generateImage(
    @Req() _req: { user: AuthenticatedRequestUser },
    @Body() dto: GenerateImageDto,
  ): Promise<{ url: string }> {
    const url = await this.mediaService.generateImage(dto.prompt);
    return { url };
  }
}
