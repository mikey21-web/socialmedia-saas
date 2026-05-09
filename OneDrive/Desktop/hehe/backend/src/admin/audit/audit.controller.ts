import { Body, Controller, Get, Header, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminGuard } from '../admin.guard';
import { AdminAuditService } from './audit.service';

type AuditQuery = { teamId?: string; userId?: string; action?: string; dateFrom?: string; dateTo?: string };

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller(['admin/audit', 'api/admin/audit'])
export class AdminAuditController {
  constructor(private readonly audit: AdminAuditService) {}

  @Get()
  logs(@Query() query: AuditQuery) {
    return this.audit.logs(query);
  }

  @Post('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="audit-logs.csv"')
  export(@Body() body: AuditQuery) {
    return this.audit.exportCsv(body);
  }
}
