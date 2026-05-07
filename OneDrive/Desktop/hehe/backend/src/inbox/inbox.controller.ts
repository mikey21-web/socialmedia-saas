import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TeamId } from '../common/decorators/team.decorator';
import { InboxService } from './inbox.service';

@Controller('inbox')
@UseGuards(JwtAuthGuard)
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  private requireTeam(teamId: string | undefined): string {
    if (!teamId) throw new BadRequestException('Missing team context');
    return teamId;
  }

  @Get()
  list(
    @TeamId() teamId: string | undefined,
    @Query('status') status?: string,
    @Query('platform') platform?: string,
    @Query('generatedBy') generatedBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inboxService.list(this.requireTeam(teamId), {
      status: status || undefined,
      platform: platform || undefined,
      generatedBy: generatedBy || undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post(':postId/approve')
  approve(
    @TeamId() teamId: string | undefined,
    @Param('postId') postId: string,
    @Body('scheduledAt') scheduledAt?: string,
  ) {
    return this.inboxService.approve(this.requireTeam(teamId), postId, scheduledAt);
  }

  @Post(':postId/reject')
  reject(
    @TeamId() teamId: string | undefined,
    @Param('postId') postId: string,
    @Body('reason') reason?: string,
  ) {
    return this.inboxService.reject(this.requireTeam(teamId), postId, reason);
  }

  @Patch(':postId')
  editPost(
    @TeamId() teamId: string | undefined,
    @Param('postId') postId: string,
    @Body() body: { content?: string; title?: string; scheduledAt?: string },
  ) {
    return this.inboxService.editPost(this.requireTeam(teamId), postId, body);
  }

  @Post('bulk-approve')
  bulkApprove(
    @TeamId() teamId: string | undefined,
    @Body() body: { postIds: string[]; scheduledAt?: string },
  ) {
    if (!body.postIds?.length) {
      throw new BadRequestException('postIds array is required');
    }
    return this.inboxService.bulkApprove(
      this.requireTeam(teamId),
      body.postIds,
      body.scheduledAt,
    );
  }

  @Post('bulk-reject')
  bulkReject(
    @TeamId() teamId: string | undefined,
    @Body() body: { postIds: string[]; reason?: string },
  ) {
    if (!body.postIds?.length) {
      throw new BadRequestException('postIds array is required');
    }
    return this.inboxService.bulkReject(
      this.requireTeam(teamId),
      body.postIds,
      body.reason,
    );
  }

  @Get('stats')
  getStats(@TeamId() teamId: string | undefined) {
    return this.inboxService.getStats(this.requireTeam(teamId));
  }

  @Post(':postId/send-approval-email')
  sendApprovalEmail(
    @TeamId() teamId: string | undefined,
    @Param('postId') postId: string,
    @Body() body: { recipientEmail: string; platform?: string },
  ) {
    return this.inboxService.sendApprovalEmail(
      this.requireTeam(teamId),
      postId,
      body.recipientEmail,
      body.platform,
    );
  }
}
