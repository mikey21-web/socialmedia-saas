import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TeamId } from '../common/decorators/team.decorator';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @TeamId() teamId: string | undefined,
    @Query('unread') unread?: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.notificationsService.list(teamId, unread === 'true');
  }

  @Get('count')
  async count(@TeamId() teamId: string | undefined) {
    if (!teamId) throw new BadRequestException('Missing team context');
    const count = await this.notificationsService.unreadCount(teamId);
    return { count };
  }

  @Patch('read-all')
  markAllRead(@TeamId() teamId: string | undefined) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.notificationsService.markAllRead(teamId);
  }

  @Patch(':id/read')
  markRead(
    @TeamId() teamId: string | undefined,
    @Param('id') id: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing team context');
    return this.notificationsService.markRead(teamId, id);
  }
}
