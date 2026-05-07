import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller(['admin', 'api/admin'])
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get('teams')
  getTeams(@Query('search') search?: string) {
    return this.adminService.getTeams(search);
  }

  @Get('teams/:id')
  getTeam(@Param('id') id: string) {
    return this.adminService.getTeam(id);
  }

  @Post('teams/:id/suspend')
  suspendTeam(@Param('id') id: string) {
    return this.adminService.suspendTeam(id);
  }

  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('suspended') suspended?: string,
  ) {
    return this.adminService.getUsers(
      Number(page) || 1,
      Number(limit) || 20,
      search,
      suspended === 'true' ? true : suspended === 'false' ? false : undefined,
    );
  }

  @Post('users/:id/suspend')
  suspendUser(@Param('id') id: string) {
    return this.adminService.suspendUser(id);
  }

  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() body: { role?: string; suspended?: boolean },
    @Req() req: { user: AuthenticatedRequestUser },
  ) {
    return this.adminService.updateUser(id, req.user.userId, body);
  }

  @Get('posts')
  getPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getPosts(Number(page) || 1, Number(limit) || 20, status);
  }

  @Post('posts/:id/delete')
  deletePost(@Param('id') id: string, @Req() req: { user: AuthenticatedRequestUser }) {
    return this.adminService.deletePost(id, req.user.userId);
  }

  @Get('subscriptions')
  getSubscriptions(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getSubscriptions(Number(page) || 1, Number(limit) || 20);
  }

  @Get('audit-logs')
  getAuditLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAuditLogs(Number(page) || 1, Number(limit) || 50);
  }
}
