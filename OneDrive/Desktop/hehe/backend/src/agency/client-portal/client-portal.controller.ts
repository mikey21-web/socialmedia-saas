import { Body, Controller, Get, Param, Post, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { TeamId } from '../../common/decorators/team.decorator';
import { ClientPortalService, CreateClientPortalDto, BulkOnboardClientDto } from './client-portal.service';

@Controller('agency/clients')
export class ClientPortalController {
  constructor(private readonly service: ClientPortalService) {}

  // ─── Agency endpoints (require auth) ──────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post()
  createPortal(
    @Req() req: { user: { team_id: string } },
    @Body() dto: CreateClientPortalDto,
  ) {
    return this.service.createClientPortal(req.user.team_id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  listPortals(@Req() req: { user: { team_id: string } }) {
    return this.service.listClientPortals(req.user.team_id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deactivatePortal(
    @Req() req: { user: { team_id: string } },
    @Param('id') portalId: string,
  ) {
    return this.service.deactivatePortal(req.user.team_id, portalId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk-onboard')
  bulkOnboard(
    @Req() req: { user: { team_id: string } },
    @Body() body: { clients: BulkOnboardClientDto[] },
  ) {
    return this.service.bulkOnboard(req.user.team_id, body.clients);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bulk-onboard/:jobId')
  getBulkOnboardStatus(
    @Req() req: { user: { team_id: string } },
    @Param('jobId') jobId: string,
  ) {
    return this.service.getBulkOnboardStatus(req.user.team_id, jobId);
  }

  // ─── Client portal endpoints (token-based, no auth) ───────────────────────

  @Get('portal/:token')
  getClientView(@Param('token') token: string) {
    return this.service.getClientView(token);
  }

  @Post('portal/:token/posts/:postId/approve')
  clientApprove(
    @Param('token') token: string,
    @Param('postId') postId: string,
  ) {
    return this.service.clientApprovePost(token, postId);
  }

  @Post('portal/:token/posts/:postId/reject')
  clientReject(
    @Param('token') token: string,
    @Param('postId') postId: string,
    @Body('reason') reason?: string,
  ) {
    return this.service.clientRejectPost(token, postId, reason);
  }
}
