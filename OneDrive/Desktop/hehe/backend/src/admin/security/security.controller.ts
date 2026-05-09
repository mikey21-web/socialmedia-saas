import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminGuard } from '../admin.guard';
import { AdminSecurityService } from './security.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller(['admin/security', 'api/admin/security'])
export class AdminSecurityController {
  constructor(private readonly security: AdminSecurityService) {}

  @Get('api-keys')
  apiKeys(@Query('teamId') teamId: string) { return this.security.apiKeys(teamId); }
  @Post('api-keys')
  createApiKey(@Body() body: { teamId: string; description?: string }) { return this.security.createApiKey(body); }
  @Delete('api-keys/:id')
  revokeApiKey(@Param('id') id: string) { return this.security.revokeApiKey(id); }
  @Get('ip-whitelist')
  whitelist(@Query('teamId') teamId: string) { return this.security.whitelist(teamId); }
  @Post('ip-whitelist')
  addIp(@Body() body: { teamId: string; ipAddress: string; ip_address?: string; description?: string }) { return this.security.addIp(body); }
  @Delete('ip-whitelist/:id')
  removeIp(@Param('id') id: string) { return this.security.removeIp(id); }
  @Get('sessions')
  sessions(@Query('teamId') teamId: string) { return this.security.sessions(teamId); }
  @Delete('sessions/:id')
  revokeSession(@Param('id') id: string) { return this.security.revokeSession(id); }
}
