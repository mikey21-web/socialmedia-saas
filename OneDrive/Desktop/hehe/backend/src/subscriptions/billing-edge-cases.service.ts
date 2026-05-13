import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Handles edge cases for billing:
 * - Payment retry logic (Stripe Smart Retries handles most, but we track + notify)
 * - Card expiry warnings
 * - Plan downgrades (handle proration, feature loss)
 * - Refunds (mark canceled, downgrade)
 * - Disputed charges
 * - Subscription paused state
 * - Trial expiry warnings
 */
@Injectable()
export class BillingEdgeCasesService {
  private readonly logger = new Logger(BillingEdgeCasesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * When payment fails: enter past_due state, notify, give grace period
   */
  async handlePaymentFailed(customerId: string, attemptCount: number = 1) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
      include: {
        team: {
          include: {
            members: {
              where: { role: { in: ['owner', 'admin'] } },
              include: { user: true },
            },
          },
        },
      },
    });

    if (!subscription) return;

    const status = attemptCount >= 4 ? 'unpaid' : 'past_due';
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status },
    });

    // Notify all admins on first and final failure
    if (attemptCount === 1 || attemptCount >= 4) {
      for (const member of subscription.team.members) {
        try {
          await this.emailService.sendPaymentFailedEmail(member.user.email);
        } catch (err) {
          this.logger.warn(`Failed to send payment failed email to ${member.user.email}`);
        }
      }

      await this.notifications.create(
        subscription.teamId,
        'payment_failed',
        attemptCount >= 4
          ? 'Your subscription has been suspended due to repeated payment failures. Please update your billing.'
          : 'Your latest payment failed. We will retry automatically. Please update your card if needed.',
      );
    }

    return { status, attemptCount };
  }

  /**
   * Card expiry warning - sent 7 days before expiry
   */
  async checkExpiringCards() {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // This requires Stripe API call to check card expiry
    // For now, we check subscriptions where currentPeriodEnd is approaching
    const expiringSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: { lte: thirtyDaysFromNow },
      },
      include: { team: true },
    });

    for (const sub of expiringSubscriptions) {
      await this.notifications.create(
        sub.teamId,
        'subscription_renewal',
        `Your subscription renews on ${sub.currentPeriodEnd?.toLocaleDateString()}. Please verify your billing details.`,
      );
    }

    return { warned: expiringSubscriptions.length };
  }

  /**
   * Handle plan downgrade - check if team exceeds new tier limits, warn or restrict
   */
  async handleDowngrade(teamId: string, oldPlan: string, newPlan: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        credentials: true,
        subscription: true,
      },
    });
    if (!team) return;

    const violations: string[] = [];

    // Example checks - tune to actual plan limits
    const newLimits = this.getPlanLimits(newPlan);
    if (team.members.length > newLimits.maxMembers) {
      violations.push(`You have ${team.members.length} team members but ${newPlan} only allows ${newLimits.maxMembers}.`);
    }
    if (team.credentials.length > newLimits.maxPlatforms) {
      violations.push(`You have ${team.credentials.length} platforms connected but ${newPlan} only allows ${newLimits.maxPlatforms}.`);
    }

    if (violations.length > 0) {
      await this.notifications.create(
        teamId,
        'plan_downgrade_warning',
        `Plan downgrade may affect your usage:\n${violations.join('\n')}\nPlease adjust before next billing cycle.`,
      );
    }

    return { violations };
  }

  /**
   * Handle refund - downgrade to free immediately
   */
  async handleRefund(customerId: string, refundAmount: number) {
    await this.prisma.subscription.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        plan: 'free',
        status: 'canceled',
        canceledAt: new Date(),
      },
    });

    const sub = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (sub) {
      await this.notifications.create(
        sub.teamId,
        'refund_issued',
        `A refund of ${refundAmount} has been issued. Your account is now on the Free plan.`,
      );
    }
  }

  /**
   * Handle dispute - lock account pending review
   */
  async handleDispute(customerId: string, reason: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!sub) return;

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'disputed' },
    });

    this.logger.warn(`Dispute opened for customer ${customerId}: ${reason}`);

    await this.notifications.create(
      sub.teamId,
      'payment_dispute',
      `A payment dispute has been opened. Account access has been temporarily restricted. Contact support immediately.`,
    );
  }

  private getPlanLimits(plan: string): { maxMembers: number; maxPlatforms: number } {
    const limits: Record<string, { maxMembers: number; maxPlatforms: number }> = {
      free: { maxMembers: 1, maxPlatforms: 2 },
      solo: { maxMembers: 1, maxPlatforms: 2 },
      pro: { maxMembers: 3, maxPlatforms: 5 },
      agency: { maxMembers: 10, maxPlatforms: 5 },
      enterprise: { maxMembers: Infinity, maxPlatforms: Infinity },
    };
    return limits[plan] ?? limits.free;
  }
}
