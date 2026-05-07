import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TeamId } from '../common/decorators/team.decorator';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  async getRecommendations(@TeamId() teamId: string | undefined): Promise<unknown> {
    if (!teamId) return { recommendations: [], cached: false, stale: false };
    return this.recommendationsService.getRecommendations(teamId);
  }

  @Post('refresh')
  async refreshRecommendations(@TeamId() teamId: string | undefined): Promise<unknown> {
    if (!teamId) return [];
    return this.recommendationsService.refreshRecommendations(teamId);
  }
}
