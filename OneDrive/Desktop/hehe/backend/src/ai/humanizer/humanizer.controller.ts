import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { HumanizerService } from './humanizer.service';

@Controller('humanizer')
@UseGuards(JwtAuthGuard)
export class HumanizerController {
  constructor(private readonly humanizer: HumanizerService) {}

  @Post('humanize')
  async humanize(@Body() body: { text: string; platform?: string }) {
    return this.humanizer.humanize(body.text, { platform: body.platform });
  }

  @Post('score')
  async score(@Body() body: { text: string }) {
    return { aiScore: this.humanizer.scoreAiLikelihood(body.text) };
  }
}
