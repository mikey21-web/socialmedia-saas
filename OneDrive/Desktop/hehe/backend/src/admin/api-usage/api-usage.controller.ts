import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminGuard } from '../admin.guard';
import { ApiUsageService } from './api-usage.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller(['admin/api-usage', 'api/admin/api-usage'])
export class ApiUsageController {
  constructor(private readonly apiUsage: ApiUsageService) {}

  @Get('top-endpoints')
  topEndpoints() {
    return this.apiUsage.topEndpoints();
  }

  @Get('slowest-endpoints')
  slowestEndpoints() {
    return this.apiUsage.slowestEndpoints();
  }

  @Get('errors')
  errors() {
    return this.apiUsage.errorEndpoints();
  }
}
