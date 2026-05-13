import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AutoOnboardService, AutoOnboardInput } from './auto-onboard.service';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class AutoOnboardController {
  constructor(private readonly autoOnboard: AutoOnboardService) {}

  @Post('scrape-website')
  async scrapeWebsite(
    @Req() req: { user: { team_id: string } },
    @Body() body: AutoOnboardInput,
  ) {
    return this.autoOnboard.scrapeAndAnalyze(req.user.team_id, body);
  }

  @Post('apply-suggestions')
  async applySuggestions(
    @Req() req: { user: { team_id: string } },
    @Body() body: { suggestions: Record<string, unknown> },
  ) {
    return this.autoOnboard.applyToProfile(req.user.team_id, body.suggestions as any);
  }
}
