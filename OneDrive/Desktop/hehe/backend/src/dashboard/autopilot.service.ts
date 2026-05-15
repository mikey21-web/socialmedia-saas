import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutopilotService {
  constructor(private prisma: PrismaService) {}

  async getStatus(teamId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const [published, pendingApproval] = await Promise.all([
      this.prisma.post.count({ where: { teamId, status: 'published', updatedAt: { gte: since } } }),
      this.prisma.post.count({ where: { teamId, status: 'pending_approval' } }),
    ]);
    return {
      enabled: team?.autopilotMode ?? false,
      enabledAt: team?.autopilotEnabledAt?.toISOString() ?? null,
      last7d: { published, pendingApproval },
    };
  }

  async toggle(teamId: string, enabled: boolean) {
    await this.prisma.team.update({
      where: { id: teamId },
      data: {
        autopilotMode: enabled,
        autopilotEnabledAt: enabled ? new Date() : null,
      },
    });
    return this.getStatus(teamId);
  }
}
