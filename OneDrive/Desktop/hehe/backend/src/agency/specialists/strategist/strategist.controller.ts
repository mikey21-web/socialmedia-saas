import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt.guard';
import { StrategistService } from './strategist.service';

@Controller('agency/strategist')
@UseGuards(JwtAuthGuard)
export class StrategistController {
  constructor(private readonly strategist: StrategistService) {}

  @Post('generate')
  generate(
    @Req() req: { user: { team_id: string } },
    @Body()
    body: {
      brandVoiceId: string;
      verticalSlug: string;
      goals: { followers?: number; engagement?: number; leads?: number };
      platforms: string[];
      durationDays?: number;
    },
  ) {
    return this.strategist.generateStrategy({
      teamId: req.user.team_id,
      ...body,
    });
  }

  @Get('strategies')
  list(@Req() req: { user: { team_id: string } }) {
    return this.strategist.listStrategies(req.user.team_id);
  }

  @Post('refine/:id')
  refine(@Param('id') id: string) {
    return this.strategist.refineStrategy(id);
  }

  @Get('weekly-briefs/:strategyId')
  weeklyBriefs(@Param('strategyId') strategyId: string) {
    return this.strategist.generateWeeklyBriefs(strategyId);
  }
}
