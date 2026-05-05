import { InternalServerErrorException } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from './subscriptions.service';

const mockPrisma = {
  team: {
    findFirst: jest.fn(),
  },
  subscription: {
    upsert: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  post: {
    count: jest.fn(),
  },
  analyticsEvent: {
    count: jest.fn(),
  },
};

const mockEmail = {
  sendPaymentSuccessEmail: jest.fn(),
};

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_PRICE_ID_PRO: 'price_pro',
      APP_URL: 'https://app.example.com',
    };
    service = new SubscriptionsService(
      mockPrisma as unknown as PrismaService,
      mockEmail as unknown as EmailService,
    );
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('creates a Stripe checkout session and stores customer/price IDs', async () => {
    mockPrisma.team.findFirst.mockResolvedValue({
      id: 'team-1',
      name: 'Team One',
      subscription: null,
      members: [{ user: { email: 'owner@example.com' } }],
    });
    mockPrisma.subscription.upsert.mockResolvedValue({
      teamId: 'team-1',
      plan: 'free',
      status: 'active',
      stripeCustomerId: null,
    });
    mockPrisma.subscription.update.mockResolvedValue({});
    (service as unknown as { stripeClient: unknown }).stripeClient = {
      customers: {
        create: jest.fn().mockResolvedValue({ id: 'cus_123' }),
      },
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({ url: 'https://stripe.test/session' }),
        },
      },
    };

    const url = await service.createCheckoutSession('team-1', 'price_pro');

    expect(url).toBe('https://stripe.test/session');
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { teamId: 'team-1' },
      data: {
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_pro',
      },
    });
  });

  it('throws when checkout price is not configured', async () => {
    delete process.env.STRIPE_PRICE_ID_PRO;

    await expect(service.createCheckoutSession('team-1')).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('upgrades a team from a Stripe checkout session', async () => {
    const renewal = Math.floor(new Date('2026-06-01T00:00:00.000Z').getTime() / 1000);
    (service as unknown as { stripeClient: unknown }).stripeClient = {
      checkout: {
        sessions: {
          retrieve: jest.fn().mockResolvedValue({
            metadata: { teamId: 'team-1' },
            customer: 'cus_123',
            subscription: {
              id: 'sub_123',
              status: 'active',
              current_period_end: renewal,
              items: { data: [{ price: { id: 'price_pro' } }] },
            },
          }),
        },
      },
    };
    mockPrisma.subscription.upsert.mockResolvedValue({
      plan: 'pro',
      status: 'active',
      currentPeriodEnd: new Date('2026-06-01T00:00:00.000Z'),
      team: { members: [{ user: { email: 'owner@example.com' } }] },
    });

    const result = await service.upgradeTeam('team-1', 'cs_123');

    expect(result.plan).toBe('pro');
    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { teamId: 'team-1' },
      update: expect.objectContaining({
        plan: 'pro',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_pro',
      }),
    }));
    expect(mockEmail.sendPaymentSuccessEmail).toHaveBeenCalled();
  });

  it('reports free usage counts for feature limits', async () => {
    mockPrisma.post.count.mockResolvedValue(1);
    mockPrisma.analyticsEvent.count.mockResolvedValue(100);

    await expect(service.getDailyPostCount('team-1')).resolves.toBe(1);
    await expect(service.getMonthlyAnalyticsEventCount('team-1')).resolves.toBe(100);
  });
});
