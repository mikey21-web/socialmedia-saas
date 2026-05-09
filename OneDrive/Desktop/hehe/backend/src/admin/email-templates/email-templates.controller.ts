import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminGuard } from '../admin.guard';
import { AdminEmailTemplatesService } from './email-templates.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller(['admin/email-templates', 'api/admin/email-templates'])
export class AdminEmailTemplatesController {
  constructor(private readonly templates: AdminEmailTemplatesService) {}

  @Get()
  list() { return this.templates.list(); }
  @Post()
  create(@Body() body: { slug: string; subject: string; htmlBody?: string; html_body?: string; textBody?: string; text_body?: string; variables?: unknown }) { return this.templates.create(body); }
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { slug?: string; subject?: string; htmlBody?: string; html_body?: string; textBody?: string; text_body?: string; variables?: unknown }) { return this.templates.update(id, body); }
  @Post(':id/send-test')
  sendTest(@Param('id') id: string, @Body() body: { to?: string }) { return this.templates.sendTest(id, body.to); }
}
