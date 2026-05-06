import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class TeamsService {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly prisma: PrismaService,
  ) {}

  getTeamPlan(teamId: string) {
    return this.subscriptionsService.getTeamPlan(teamId);
  }

  getDailyPostCount(teamId: string) {
    return this.subscriptionsService.getDailyPostCount(teamId);
  }

  getMonthlyAnalyticsEventCount(teamId: string) {
    return this.subscriptionsService.getMonthlyAnalyticsEventCount(teamId);
  }

  async updateSignature(teamId: string, signature: string) {
    return this.prisma.team.update({
      where: { id: teamId },
      data: { signature },
      select: { signature: true },
    });
  }

  async getTeamSignature(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { signature: true },
    });

    return team?.signature ?? null;
  }

  async inviteMember(teamId: string, userId: string, role = 'editor') {
    const [memberCount, plan] = await Promise.all([
      this.prisma.teamMember.count({ where: { teamId } }),
      this.subscriptionsService.getTeamPlan(teamId),
    ]);

    if (plan === 'free' && memberCount >= 1) {
      throw new ForbiddenException('Upgrade to Pro to invite team members');
    }

    return this.prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role,
      },
    });
  }
}
