import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { MultilingualService, SupportedLanguage } from './multilingual.service';

@Controller('ai/multilingual')
@UseGuards(JwtAuthGuard)
export class MultilingualController {
  constructor(private readonly service: MultilingualService) {}

  @Get('languages')
  getLanguages() {
    return this.service.getLanguages();
  }

  @Post('generate')
  generate(
    @Body() body: {
      topic: string;
      language: SupportedLanguage;
      platform?: string;
      tone?: string;
      brandName?: string;
      audience?: string;
    },
  ) {
    return this.service.generateCaption(body.topic, body.language, {
      platform: body.platform,
      tone: body.tone,
      brandName: body.brandName,
      audience: body.audience,
    });
  }

  @Post('translate')
  translate(
    @Body() body: {
      content: string;
      targetLanguage: SupportedLanguage;
      platform?: string;
      tone?: string;
    },
  ) {
    return this.service.translateContent(body.content, body.targetLanguage, {
      platform: body.platform,
      tone: body.tone,
    });
  }
}
