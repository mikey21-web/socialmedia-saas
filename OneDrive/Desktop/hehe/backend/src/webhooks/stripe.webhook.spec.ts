import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { StripeWebhookController } from './stripe.webhook';

const mockSubscriptions = {
  handlePaymentSucceeded: jest.fn(),
  handlePaymentFailed: jest.fn(),
  cancelByStripeSubscription: jest.fn(),
};

describe('StripeWebhookController', () => {
  let controller: StripeWebhookController;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_WEBHOOK_SECRET: 'whsec_123',
    };
    controller = new StripeWebhookController(
      mockSubscriptions as unknown as SubscriptionsService,
    );
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('handles invoice.payment_succeeded events', async () => {
    (controller as unknown as { stripeClient: unknown }).stripeClient = {
      webhooks: {
        constructEvent: jest.fn().mockReturnValue({
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              customer: 'cus_123',
              lines: {
                data: [{
                  pricing: { price_details: { price: 'price_pro' } },
                  period: { end: 1780272000 },
                }],
              },
            },
          },
        }),
      },
    };

    const result = await controller.handleStripeWebhook(
      { rawBody: Buffer.from('{}') } as never,
      'sig',
    );

    expect(result).toEqual({ received: true });
    expect(mockSubscriptions.handlePaymentSucceeded).toHaveBeenCalledWith(
      'cus_123',
      'price_pro',
      new Date(1780272000 * 1000),
    );
  });

  it('handles invoice.payment_failed events', async () => {
    (controller as unknown as { stripeClient: unknown }).stripeClient = {
      webhooks: {
        constructEvent: jest.fn().mockReturnValue({
          type: 'invoice.payment_failed',
          data: { object: { customer: 'cus_123' } },
        }),
      },
    };

    await controller.handleStripeWebhook({ rawBody: Buffer.from('{}') } as never, 'sig');

    expect(mockSubscriptions.handlePaymentFailed).toHaveBeenCalledWith('cus_123');
  });

  it('handles customer.subscription.deleted events', async () => {
    (controller as unknown as { stripeClient: unknown }).stripeClient = {
      webhooks: {
        constructEvent: jest.fn().mockReturnValue({
          type: 'customer.subscription.deleted',
          data: { object: { id: 'sub_123', customer: 'cus_123' } },
        }),
      },
    };

    await controller.handleStripeWebhook({ rawBody: Buffer.from('{}') } as never, 'sig');

    expect(mockSubscriptions.cancelByStripeSubscription).toHaveBeenCalledWith(
      'sub_123',
      'cus_123',
    );
  });

  it('rejects invalid signatures', async () => {
    (controller as unknown as { stripeClient: unknown }).stripeClient = {
      webhooks: {
        constructEvent: jest.fn(() => {
          throw new Error('bad signature');
        }),
      },
    };

    await expect(
      controller.handleStripeWebhook({ rawBody: Buffer.from('{}') } as never, 'sig'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('fails closed when the webhook secret is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    await expect(
      controller.handleStripeWebhook({ rawBody: Buffer.from('{}') } as never, 'sig'),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
