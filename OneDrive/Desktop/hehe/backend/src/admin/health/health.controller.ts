import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminGuard } from '../admin.guard';
import { AdminHealthService } from './health.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller(['admin/health', 'api/admin/health'])
export class AdminHealthController {
  constructor(private readonly health: AdminHealthService) {}

  @Get('status')
  status() {
    return this.health.status();
  }

  @Get('temporal-jobs')
  temporalJobs() {
    return this.health.temporalJobs();
  }

  @Get('errors')
  errors() {
    return this.health.errors();
  }
}
