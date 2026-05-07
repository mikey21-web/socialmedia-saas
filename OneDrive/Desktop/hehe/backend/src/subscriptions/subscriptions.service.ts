import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import StripeConstructor = require('stripe');
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

type StripeCheckoutSession = {
  metadata?: Record<string, string> | null;
  customer?: string | { id: string } | null;
  subscription?: string | { id?: string } | null;
};

type StripeSubscription = {
  id: string;
  metadata: Record<string, string>;
  customer: string | { id: string };
  status: string;
  current_period_end?: number | null;
  canceled_at?: number | null;
  items: { data: Array<{ price: { id: string } }> };
};

type StripeInvoice = {
  customer?: string | { id: string } | null;
};

@Injectable()
export class SubscriptionsService {
  private stripeClient?: StripeConstructor.Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  listPlans() {
    return ['free', 'pro'];
  }

  async createCheckoutSession(teamId: string, userId?: string) {
    const priceId = process.env.STRIPE_PRO_PRICE_ID ?? process.env.STRIPE_PRICE_ID_PRO;
    if (!priceId) {
      throw new InternalServerErrorException('STRIPE_PRO_PRICE_ID is not configured');
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
    if (userId && !team.members.some((member) => member.userId === userId)) {
      throw new ForbiddenException('You do not have access to this team');
    }

    const subscription = await this.ensureSubscription(teamId);
    const customerId = subscription.stripeCustomerId
      ?? await this.createStripeCustomer(teamId, team.members[0]?.user.email, team.name);

    const baseUrl = process.env.APP_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const session = await this.getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/settings/billing?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/settings/billing?stripe=cancel`,
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

    return { url: session.url };
  }

  async createBillingPortalSession(teamId: string) {
    const subscription = await this.ensureSubscription(teamId);
    if (!subscription.stripeCustomerId) {
      throw new NotFoundException('Stripe customer not found for this team');
    }

    const baseUrl = process.env.APP_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const session = await this.getStripe().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}/settings/billing`,
    });

    return { url: session.url };
  }

  async getSubscription(teamId: string) {
    return this.getSubscriptionStatus(teamId);
  }

  async getSubscriptionStatus(teamId: string) {
    const [subscription, postsUsedThisMonth, platformsConnected, memberCount] = await Promise.all([
      this.ensureSubscription(teamId),
      this.getMonthlyScheduledPostCount(teamId),
      this.prisma.platformCredential.count({ where: { teamId } }),
      this.prisma.teamMember.count({ where: { teamId } }),
    ]);
    return {
      plan: this.resolvePlan(subscription.plan, subscription.status) as 'free' | 'pro',
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      renewalDate: subscription.currentPeriodEnd,
      seats: subscription.seats,
      limits: {
        posts: { current: postsUsedThisMonth, max: 10 },
        platforms: { current: platformsConnected, max: 3 },
        members: { current: memberCount, max: 2 },
      },
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

    const stripeSubscription = typeof session.subscription === 'object' && session.subscription !== null
      ? session.subscription as unknown as StripeSubscription
      : null;
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
    const result = await this.updateByCustomer(customerId, {
      status: 'past_due',
    });

    const subscription = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
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
    const email = subscription?.team.members[0]?.user.email;
    if (email) {
      await this.emailService.sendPaymentFailedEmail(email);
    }
    return result;
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

  async getMonthlyScheduledPostCount(teamId: string) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return this.prisma.post.count({
      where: {
        teamId,
        deletedAt: null,
        status: { in: ['scheduled', 'published', 'partial', 'publishing'] },
        createdAt: { gte: monthStart },
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

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new InternalServerErrorException('STRIPE_WEBHOOK_SECRET is not configured');
    }

    const event = this.getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as StripeCheckoutSession;
      await this.handleCheckoutCompleted(session);
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as StripeSubscription;
      await this.updateSubscriptionFromStripe(subscription);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as StripeSubscription;
      await this.cancelByStripeSubscription(
        subscription.id,
        typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
      );
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as StripeInvoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        await this.handlePaymentFailed(customerId);
      }
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: StripeCheckoutSession) {
    const teamId = session.metadata?.teamId;
    if (!teamId) return;

    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;
    if (!subscriptionId) return;

    const subscription = await this.getStripe().subscriptions.retrieve(subscriptionId) as StripeSubscription;
    await this.updateSubscriptionFromStripe(subscription, teamId);
  }

  private async updateSubscriptionFromStripe(subscription: StripeSubscription, fallbackTeamId?: string) {
    const teamId = subscription.metadata.teamId ?? fallbackTeamId;
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;
    const priceId = subscription.items.data[0]?.price.id;
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;
    const plan = ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status) ? 'pro' : 'free';

    if (teamId) {
      await this.prisma.subscription.upsert({
        where: { teamId },
        create: {
          teamId,
          plan,
          status: subscription.status,
          stripeId: subscription.id,
          stripeCustomerId: customerId,
          stripePriceId: priceId,
          currentPeriodEnd: periodEnd,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        },
        update: {
          plan,
          status: subscription.status,
          stripeId: subscription.id,
          stripeCustomerId: customerId,
          stripePriceId: priceId,
          currentPeriodEnd: periodEnd,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        },
      });
      return;
    }

    await this.updateByCustomer(customerId, {
      plan,
      status: subscription.status,
      stripePriceId: priceId,
      currentPeriodEnd: periodEnd,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    });
  }

  private getStripe(): StripeConstructor.Stripe {
    if (this.stripeClient) {
      return this.stripeClient;
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new InternalServerErrorException('STRIPE_SECRET_KEY is not configured');
    }

    this.stripeClient = new StripeConstructor(secretKey);
    return this.stripeClient;
  }

  private resolvePlan(plan: string, status: string) {
    return plan === 'pro' && ACTIVE_SUBSCRIPTION_STATUSES.has(status) ? 'pro' : 'free';
  }
}
