import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminGuard } from '../admin.guard';
import { AdminPerformanceService } from './performance.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller(['admin/performance', 'api/admin/performance'])
export class AdminPerformanceController {
  constructor(private readonly performance: AdminPerformanceService) {}

  @Get('db-queries')
  dbQueries() { return this.performance.dbQueries(); }
  @Get('llm-latency')
  llmLatency() { return this.performance.llmLatency(); }
  @Get('temporal-duration')
  temporalDuration() { return this.performance.temporalDuration(); }
}
