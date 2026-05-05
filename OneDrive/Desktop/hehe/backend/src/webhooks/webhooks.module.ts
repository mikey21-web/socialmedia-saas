import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { StripeWebhookController } from './stripe.webhook';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [AnalyticsModule, SubscriptionsModule],
  controllers: [WebhooksController, StripeWebhookController],
})
export class WebhooksModule {}
