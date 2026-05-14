import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

/**
 * Automated email marketing flows.
 * Sends timed sequences based on user lifecycle events.
 */
@Injectable()
export class EmailFlowsService {
  private readonly logger = new Logger(EmailFlowsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  /**
   * Daily at 9am IST — send onboarding nudges to users who signed up
   * but haven't completed onboarding after 24 hours.
   */
  @Cron('0 9 * * *')
  async sendOnboardingNudges() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const incompleteTeams = await this.prisma.team.findMany({
      where: {
        onboardingComplete: false,
        createdAt: { gte: threeDaysAgo, lte: oneDayAgo },
        deletedAt: null,
      },
      include: {
        members: {
          include: { user: true },
          orderBy: { id: 'asc' },
          take: 1,
        },
      },
      take: 50,
    });

    let sent = 0;
    for (const team of incompleteTeams) {
      const email = team.members[0]?.user.email;
      if (!email) continue;

      try {
        await this.email.sendOnboardingNudge(email, team.name);
        sent++;
      } catch (err) {
        this.logger.warn(`Failed to send onboarding nudge to ${email}: ${(err as Error)?.message}`);
      }
    }

    this.logger.log(`Onboarding nudges sent: ${sent}/${incompleteTeams.length}`);
  }

  /**
   * Weekly on Monday 10am IST — send weekly digest to active teams.
   */
  @Cron('0 10 * * 1')
  async sendWeeklyDigests() {
    const activeTeams = await this.prisma.team.findMany({
      where: {
        onboardingComplete: true,
        deletedAt: null,
      },
      include: {
        members: {
          include: { user: true },
          orderBy: { id: 'asc' },
          take: 1,
        },
        subscription: true,
      },
      take: 500,
    });

    let sent = 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const team of activeTeams) {
      const email = team.members[0]?.user.email;
      const name = team.members[0]?.user.name ?? 'there';
      if (!email) continue;

      try {
        const postsPublished = await this.prisma.post.count({
          where: { teamId: team.id, status: 'published', createdAt: { gte: sevenDaysAgo } },
        });

        if (postsPublished === 0) continue;

        const events = await this.prisma.analyticsEvent.findMany({
          where: { post: { teamId: team.id }, collectedAt: { gte: sevenDaysAgo } },
          select: { eventType: true, count: true },
        });

        let impressions = 0;
        let engagements = 0;
        for (const e of events) {
          if (e.eventType.includes('impression')) impressions += e.count;
          if (e.eventType.includes('engagement') || e.eventType.includes('like') || e.eventType.includes('comment')) {
            engagements += e.count;
          }
        }

        const engagementRate = impressions > 0 ? ((engagements / impressions) * 100).toFixed(1) : '0.0';

        const topPost = await this.prisma.post.findFirst({
          where: { teamId: team.id, status: 'published', createdAt: { gte: sevenDaysAgo } },
          orderBy: { impressions: 'desc' },
          select: { title: true, impressions: true },
        });

        await this.email.sendWeeklyDigest(email, {
          name,
          appName: 'Diyaa AI',
          appUrl: process.env.FRONTEND_URL ?? 'https://diyaa.ai',
          postsPublished,
          totalImpressions: impressions,
          totalEngagements: engagements,
          engagementRate,
          topPostTitle: topPost?.title ?? 'No top post this week',
          topPostEngagements: topPost?.impressions ?? 0,
        });

        sent++;
      } catch (err) {
        this.logger.warn(`Failed to send weekly digest to ${email}: ${(err as Error)?.message}`);
      }
    }

    this.logger.log(`Weekly digests sent: ${sent}/${activeTeams.length}`);
  }

  /**
   * Daily at 11am IST — send upgrade prompts to free users who are
   * hitting their limits (>80% usage).
   */
  @Cron('0 11 * * *')
  async sendUpgradePrompts() {
    const freeTeams = await this.prisma.subscription.findMany({
      where: { plan: { in: ['free', 'solo'] }, status: 'active' },
      include: {
        team: {
          include: {
            members: { include: { user: true }, orderBy: { id: 'asc' }, take: 1 },
          },
        },
      },
      take: 100,
    });

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let sent = 0;
    for (const sub of freeTeams) {
      const email = sub.team.members[0]?.user.email;
      if (!email) continue;

      const postCount = await this.prisma.post.count({
        where: {
          teamId: sub.teamId,
          status: { in: ['scheduled', 'published'] },
          createdAt: { gte: monthStart },
        },
      });

      const limit = sub.plan === 'solo' ? 30 : 30;
      if (postCount < limit * 0.8) continue;

      try {
        await this.email.sendUpgradePrompt(email, sub.plan, postCount, limit);
        sent++;
      } catch {
        // skip
      }
    }

    this.logger.log(`Upgrade prompts sent: ${sent}`);
  }
}
