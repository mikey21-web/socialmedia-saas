import { Controller, Get, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TeamId } from '../common/decorators/team.decorator';
import { GrowthProjectionService } from './growth-projection.service';

@Controller('analytics/growth-projection')
@UseGuards(JwtAuthGuard)
export class GrowthProjectionController {
  constructor(private readonly service: GrowthProjectionService) {}

  @Get()
  async getProjection(@TeamId() teamId: string | undefined) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.service.getProjection(teamId);
  }
}
