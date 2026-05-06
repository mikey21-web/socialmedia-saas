import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get()
  root(): { service: string; status: string } {
    return { service: 'postiz-competitor-api', status: 'ok' };
  }
}
