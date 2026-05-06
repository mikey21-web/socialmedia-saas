import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService, GenerateCaptionDto, GeneratedCaption } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-caption')
  generateCaption(@Body() dto: GenerateCaptionDto): Promise<GeneratedCaption> {
    return this.aiService.generateCaption(dto);
  }
}
