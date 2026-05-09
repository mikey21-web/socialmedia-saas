import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const NOTIFICATION_TITLES: Record<string, string> = {
  gap_alert: 'Posting gap detected',
  viral_spike: '🔥 Post going viral',
  post_published: 'Post published',
  weekly_digest: 'Weekly summary ready',
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    teamId: string,
    type: string,
    message: string,
    data: Record<string, unknown> = {},
  ) {
    return this.prisma.notification.create({
      data: {
        teamId,
        type,
        title: NOTIFICATION_TITLES[type] ?? type,
        message,
        data: data as Prisma.InputJsonValue,
      },
    });
  }

  async list(teamId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        teamId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(teamId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, teamId },
      data: { read: true },
    });
  }

  async markAllRead(teamId: string) {
    return this.prisma.notification.updateMany({
      where: { teamId, read: false },
      data: { read: true },
    });
  }

  async unreadCount(teamId: string): Promise<number> {
    return this.prisma.notification.count({ where: { teamId, read: false } });
  }
}
