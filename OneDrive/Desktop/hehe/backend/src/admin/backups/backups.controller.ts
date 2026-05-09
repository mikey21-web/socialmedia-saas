import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminGuard } from '../admin.guard';
import { AdminBackupsService } from './backups.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller(['admin/backups', 'api/admin/backups'])
export class AdminBackupsController {
  constructor(private readonly backups: AdminBackupsService) {}

  @Get()
  list() { return this.backups.list(); }
  @Post('manual')
  manual() { return this.backups.manual(); }
}
