import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Header('content-type', 'text/plain; version=0.0.4')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  prometheus(): string {
    return this.metrics.toPrometheusFormat();
  }

  @Get('json')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  json() {
    return this.metrics.toJson();
  }
}
