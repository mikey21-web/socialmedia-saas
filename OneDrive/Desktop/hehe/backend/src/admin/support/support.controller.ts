import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminGuard } from '../admin.guard';
import { AdminSupportService } from './support.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller(['admin/support', 'api/admin/support'])
export class AdminSupportController {
  constructor(private readonly support: AdminSupportService) {}

  @Get('tickets')
  tickets(@Query() query: { status?: string; priority?: string }) { return this.support.tickets(query); }
  @Post('tickets')
  create(@Body() body: { teamId: string; subject: string; description: string; priority?: string; assignedTo?: string; assigned_to?: string }) { return this.support.create(body); }
  @Patch('tickets/:id')
  update(@Param('id') id: string, @Body() body: { status?: string; priority?: string; assignedTo?: string; assigned_to?: string }) { return this.support.update(id, body); }
  @Get('tickets/:id/messages')
  messages(@Param('id') id: string) { return this.support.messages(id); }
}
