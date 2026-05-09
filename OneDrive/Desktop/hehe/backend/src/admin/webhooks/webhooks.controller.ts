import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminGuard } from '../admin.guard';
import { AdminWebhooksService } from './webhooks.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller(['admin/webhooks', 'api/admin/webhooks'])
export class AdminWebhooksController {
  constructor(private readonly webhooks: AdminWebhooksService) {}

  @Get()
  list() { return this.webhooks.list(); }
  @Post()
  create(@Body() body: { eventType: string; event_type?: string; url: string; active?: boolean }) { return this.webhooks.create(body); }
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { eventType?: string; event_type?: string; url?: string; active?: boolean }) { return this.webhooks.update(id, body); }
  @Delete(':id')
  remove(@Param('id') id: string) { return this.webhooks.remove(id); }
  @Post(':id/test')
  test(@Param('id') id: string) { return this.webhooks.test(id); }
  @Get(':id/deliveries')
  deliveries(@Param('id') id: string) { return this.webhooks.deliveries(id); }
}
