import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminGuard } from '../admin.guard';
import { AdminTeamsService } from './teams.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller(['admin/teams', 'api/admin/teams'])
export class AdminTeamsController {
  constructor(private readonly teams: AdminTeamsService) {}

  @Get()
  list() { return this.teams.list(); }
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { tier?: string; plan?: string; billingStatus?: string; billing_status?: string }) { return this.teams.update(id, body); }
  @Delete(':id')
  deactivate(@Param('id') id: string) { return this.teams.deactivate(id); }
  @Get(':id/usage')
  usage(@Param('id') id: string) { return this.teams.usage(id); }
}
