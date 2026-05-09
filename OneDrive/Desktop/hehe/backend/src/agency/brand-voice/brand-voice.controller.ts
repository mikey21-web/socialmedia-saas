import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { BrandVoiceTrainerService } from './brand-voice-trainer.service';

@Controller('agency/brand-voice')
@UseGuards(JwtAuthGuard)
export class BrandVoiceController {
  constructor(private readonly trainer: BrandVoiceTrainerService) {}

  @Post('train')
  train(
    @Req() req: { user: { team_id: string } },
    @Body()
    body: {
      posts: { platform: string; content: string; engagement: number }[];
      brandName: string;
      brandDescription: string;
    },
  ) {
    return this.trainer.trainFromPosts({ teamId: req.user.team_id, ...body });
  }

  @Post('refine/:id')
  refine(@Param('id') id: string) {
    return this.trainer.refineFromRecentPosts(id);
  }

  @Post('score')
  score(@Body() body: { brandVoiceId: string; content: string }) {
    return this.trainer.scoreVoiceMatch(body.brandVoiceId, body.content);
  }

  @Get()
  list(@Req() req: { user: { team_id: string } }) {
    return this.trainer.listVoices(req.user.team_id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      description: string;
      toneAttributes: Record<string, number>;
      vocabulary: string[];
      avoidPhrases: string[];
      emojiUsage: string;
      sentenceStyle: string;
      isActive: boolean;
    }>,
  ) {
    return this.trainer.updateVoice(id, body);
  }
}
