import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { AnalyticsService } from '../analytics/analytics.service';
import { WebhooksController } from './webhooks.controller';

const mockAnalytics = {
  recordEvent: jest.fn(),
};

describe('WebhooksController', () => {
  let controller: WebhooksController;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, TWITTER_WEBHOOK_SECRET: 'secret' };
    controller = new WebhooksController(mockAnalytics as unknown as AnalyticsService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('records signed webhook events', async () => {
    const body = { tweet_id: 'tweet-1', event_type: 'likes', value: 3 };
    const rawBody = Buffer.from(JSON.stringify(body));
    const signature = `sha256=${createHmac('sha256', 'secret').update(rawBody).digest('hex')}`;
    mockAnalytics.recordEvent.mockResolvedValue({ recorded: true });

    const result = await controller.handleTwitterWebhook(
      body,
      { rawBody } as never,
      signature,
    );

    expect(result).toEqual({ ok: true });
    expect(mockAnalytics.recordEvent).toHaveBeenCalledWith({
      platform: 'twitter',
      externalId: 'tweet-1',
      metric: 'likes',
      value: 3,
    });
  });

  it('rejects unsigned webhook events', async () => {
    const body = { tweet_id: 'tweet-1' };

    await expect(
      controller.handleTwitterWebhook(body, { rawBody: Buffer.from('{}') } as never),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('fails closed when webhook secret is missing', async () => {
    delete process.env.TWITTER_WEBHOOK_SECRET;

    await expect(
      controller.handleTwitterWebhook(
        { tweet_id: 'tweet-1' },
        { rawBody: Buffer.from('{}') } as never,
        'sha256=abc',
      ),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
