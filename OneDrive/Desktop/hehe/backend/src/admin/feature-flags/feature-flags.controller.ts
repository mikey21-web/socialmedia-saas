import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminGuard } from '../admin.guard';
import { FeatureFlagsService } from './feature-flags.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller(['admin/feature-flags', 'api/admin/feature-flags'])
export class FeatureFlagsController {
  constructor(private readonly flags: FeatureFlagsService) {}

  @Get()
  list() {
    return this.flags.list();
  }

  @Post()
  create(@Body() body: { name: string; enabled?: boolean; description?: string; rolloutPercentage?: number; rollout_percentage?: number }) {
    return this.flags.create({ ...body, rolloutPercentage: body.rolloutPercentage ?? body.rollout_percentage });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; enabled?: boolean; description?: string; rolloutPercentage?: number; rollout_percentage?: number }) {
    return this.flags.update(id, { ...body, rolloutPercentage: body.rolloutPercentage ?? body.rollout_percentage });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.flags.remove(id);
  }

  @Get('check/:flagName')
  check(@Param('flagName') flagName: string, @Query('teamId') teamId?: string) {
    return this.flags.check(flagName, teamId);
  }
}
