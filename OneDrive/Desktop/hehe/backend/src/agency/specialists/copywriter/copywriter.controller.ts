import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt.guard';
import { PlanLimit, PlanLimitGuard } from '../../../common/guards/plan-limit.guard';
import { CopywriterService } from './copywriter.service';

@Controller('agency/copywriter')
@UseGuards(JwtAuthGuard, PlanLimitGuard)
export class CopywriterController {
  constructor(private readonly copywriter: CopywriterService) {}

  @Post('generate')
  @PlanLimit('ai_runs')
  generate(
    @Req() req: { user: { team_id: string } },
    @Body()
    body: {
      brandVoiceId: string;
      platform: string;
      pillarTopic: string;
      contentType: 'educational' | 'promotional' | 'trending' | 'ugc' | 'behind_scenes';
      referenceUrl?: string;
      trendSignalId?: string;
      targetWordCount?: number;
    },
  ) {
    return this.copywriter.generatePost({ teamId: req.user.team_id, ...body });
  }

  @Post('variants')
  @PlanLimit('ai_runs')
  variants(
    @Req() req: { user: { team_id: string } },
    @Body()
    body: {
      brandVoiceId: string;
      platform: string;
      pillarTopic: string;
      contentType: 'educational' | 'promotional' | 'trending' | 'ugc' | 'behind_scenes';
      count: number;
    },
  ) {
    const { count, ...rest } = body;
    return this.copywriter.generateVariants({ teamId: req.user.team_id, ...rest }, count);
  }

  @Post('cross-platform')
  @PlanLimit('ai_runs')
  crossPlatform(
    @Req() req: { user: { team_id: string } },
    @Body()
    body: {
      sourceContent: string;
      sourcePlatform: string;
      targetPlatforms: string[];
      brandVoiceId: string;
    },
  ) {
    return this.copywriter.crossPlatformAdapt({ teamId: req.user.team_id, ...body });
  }

  @Post('score')
  score(@Body() body: { brandVoiceId: string; content: string }) {
    return this.copywriter.scoreVoiceMatch(body.brandVoiceId, body.content);
  }
}
