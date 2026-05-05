import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import StripeConstructor from 'stripe';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

type StripeClient = {
  customers: {
    create: (input: Record<string, unknown>) => Promise<{ id: string }>;
  };
  checkout: {
    sessions: {
      create: (input: Record<string, unknown>) => Promise<{ url: string | null }>;
      retrieve: (id: string, input: Record<string, unknown>) => Promise<{
        metadata?: Record<string, string>;
        customer?: string | { id?: string } | null;
        subscription?: {
          id?: string;
          status?: string;
          current_period_end?: number;
          items?: { data?: Array<{ price?: { id?: string } }> };
        } | null;
      }>;
    };
  };
};

@Injectable()
export class SubscriptionsService {
  private stripeClient?: StripeClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  listPlans() {
    return ['free', 'pro'];
  }

  async createCheckoutSession(teamId: string, priceId = process.env.STRIPE_PRICE_ID_PRO) {
    if (!priceId) {
      throw new InternalServerErrorException('STRIPE_PRICE_ID_PRO is not configured');
    }

    const team = await this.prisma.team.findFirst({
      where: { id: teamId, deletedAt: null },
      include: {
        subscription: true,
        members: {
          include: { user: true },
          orderBy: { id: 'asc' },
          take: 1,
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const subscription = await this.ensureSubscription(teamId);
    const customerId = subscription.stripeCustomerId
      ?? await this.createStripeCustomer(teamId, team.members[0]?.user.email, team.name);

    const baseUrl = process.env.APP_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const session = await this.getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing`,
      metadata: { teamId },
      subscription_data: {
        metadata: { teamId },
      },
    });

    await this.prisma.subscription.update({
      where: { teamId },
      data: {
        stripeCustomerId: customerId,
        stripePriceId: priceId,
      },
    });

    if (!session.url) {
      throw new InternalServerErrorException('Stripe did not return a checkout URL');
    }

    return session.url;
  }

  async getSubscription(teamId: string) {
    const subscription = await this.ensureSubscription(teamId);
    return {
      plan: this.resolvePlan(subscription.plan, subscription.status) as 'free' | 'pro',
      status: subscription.status,
      renewalDate: subscription.currentPeriodEnd,
    };
  }

  async upgradeTeam(teamId: string, stripeSessionId: string) {
    const session = await this.getStripe().checkout.sessions.retrieve(stripeSessionId, {
      expand: ['subscription'],
    });

    const sessionTeamId = session.metadata?.teamId;
    if (sessionTeamId && sessionTeamId !== teamId) {
      throw new ForbiddenException('Checkout session does not belong to this team');
    }

    const stripeSubscription = session.subscription;
    const customerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;
    const priceId = stripeSubscription?.items?.data?.[0]?.price?.id
      ?? process.env.STRIPE_PRICE_ID_PRO;
    const renewalDate = stripeSubscription?.current_period_end
      ? new Date(stripeSubscription.current_period_end * 1000)
      : null;
    const status = stripeSubscription?.status ?? 'active';

    const subscription = await this.prisma.subscription.upsert({
      where: { teamId },
      create: {
        teamId,
        plan: ACTIVE_SUBSCRIPTION_STATUSES.has(status) ? 'pro' : 'free',
        status,
        stripeId: stripeSubscription?.id ?? stripeSessionId,
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        currentPeriodEnd: renewalDate,
      },
      update: {
        plan: ACTIVE_SUBSCRIPTION_STATUSES.has(status) ? 'pro' : 'free',
        status,
        stripeId: stripeSubscription?.id ?? stripeSessionId,
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        currentPeriodEnd: renewalDate,
        canceledAt: null,
      },
      include: {
        team: {
          include: {
            members: {
              include: { user: true },
              orderBy: { id: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    const email = subscription.team.members[0]?.user.email;
    if (email) {
      await this.emailService.sendPaymentSuccessEmail(
        email,
        subscription.plan,
        subscription.currentPeriodEnd,
      );
    }

    return {
      plan: this.resolvePlan(subscription.plan, subscription.status),
      status: subscription.status,
      renewalDate: subscription.currentPeriodEnd,
    };
  }

  async handlePaymentSucceeded(customerId: string, priceId?: string, periodEnd?: Date | null) {
    return this.updateByCustomer(customerId, {
      plan: 'pro',
      status: 'active',
      stripePriceId: priceId,
      currentPeriodEnd: periodEnd,
      canceledAt: null,
    });
  }

  async handlePaymentFailed(customerId: string) {
    return this.updateByCustomer(customerId, {
      status: 'past_due',
    });
  }

  async cancelByStripeSubscription(stripeSubscriptionId: string, customerId?: string) {
    const where = customerId
      ? { OR: [{ stripeId: stripeSubscriptionId }, { stripeCustomerId: customerId }] }
      : { stripeId: stripeSubscriptionId };

    return this.prisma.subscription.updateMany({
      where,
      data: {
        plan: 'free',
        status: 'canceled',
        canceledAt: new Date(),
      },
    });
  }

  async getTeamPlan(teamId: string) {
    const subscription = await this.ensureSubscription(teamId);
    return this.resolvePlan(subscription.plan, subscription.status) as 'free' | 'pro';
  }

  async getDailyPostCount(teamId: string) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    return this.prisma.post.count({
      where: {
        teamId,
        deletedAt: null,
        createdAt: { gte: dayStart },
      },
    });
  }

  async getMonthlyAnalyticsEventCount(teamId: string) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return this.prisma.analyticsEvent.count({
      where: {
        collectedAt: { gte: monthStart },
        post: {
          teamId,
          deletedAt: null,
        },
      },
    });
  }

  private async updateByCustomer(
    stripeCustomerId: string,
    data: {
      plan?: string;
      status?: string;
      stripePriceId?: string;
      currentPeriodEnd?: Date | null;
      canceledAt?: Date | null;
    },
  ) {
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );
    return this.prisma.subscription.updateMany({
      where: { stripeCustomerId },
      data: updateData,
    });
  }

  private async ensureSubscription(teamId: string) {
    return this.prisma.subscription.upsert({
      where: { teamId },
      create: {
        teamId,
        plan: 'free',
        status: 'active',
      },
      update: {},
    });
  }

  private async createStripeCustomer(teamId: string, email: string | undefined, teamName: string) {
    const customer = await this.getStripe().customers.create({
      email,
      name: teamName,
      metadata: { teamId },
    });
    return customer.id;
  }

  private getStripe(): StripeClient {
    if (this.stripeClient) {
      return this.stripeClient;
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new InternalServerErrorException('STRIPE_SECRET_KEY is not configured');
    }

    this.stripeClient = new StripeConstructor(secretKey) as unknown as StripeClient;
    return this.stripeClient;
  }

  private resolvePlan(plan: string, status: string) {
    return plan === 'pro' && ACTIVE_SUBSCRIPTION_STATUSES.has(status) ? 'pro' : 'free';
  }
}
