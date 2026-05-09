import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt.guard';
import { EngagementManagerService } from './engagement-manager.service';

@Controller('agency/engagement')
@UseGuards(JwtAuthGuard)
export class EngagementManagerController {
  constructor(private readonly engagement: EngagementManagerService) {}

  @Post('process')
  processMessage(
    @Req() req: { user: { team_id: string } },
    @Body()
    body: {
      platform: string;
      messageType: 'comment' | 'dm';
      content: string;
      fromUser: string;
      postId?: string;
    },
  ) {
    return this.engagement.processIncomingMessage({
      teamId: req.user.team_id,
      ...body,
    });
  }

  @Get('actions')
  listActions(
    @Req() req: { user: { team_id: string } },
    @Query('status') status?: string,
  ) {
    return this.engagement.listActions(req.user.team_id, status);
  }

  @Get('backlog')
  backlog(@Req() req: { user: { team_id: string } }) {
    return this.engagement.processBacklog(req.user.team_id);
  }

  @Post('approve/:id')
  approve(
    @Param('id') id: string,
    @Req() req: { user: { sub: string } },
  ) {
    return this.engagement.approveAction(id, req.user.sub);
  }

  @Post('reject/:id')
  reject(@Param('id') id: string) {
    return this.engagement.rejectAction(id);
  }
}
