import {
  Controller,
  Headers,
  HttpCode,
  InternalServerErrorException,
  Post,
  Req,
  RawBodyRequest,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import StripeConstructor from 'stripe';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

type StripeWebhookClient = {
  webhooks: {
    constructEvent: (rawBody: Buffer, signature: string, secret: string) => {
      type: string;
      data: { object: Record<string, unknown> };
    };
  };
};

@Controller('webhooks')
export class StripeWebhookController {
  private stripeClient?: StripeWebhookClient;

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    const event = this.constructEvent(req.rawBody, signature);

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const customerId = this.getCustomerId(invoice.customer);
      if (customerId) {
        await this.subscriptionsService.handlePaymentSucceeded(
          customerId,
          this.getInvoicePriceId(invoice),
          this.getInvoicePeriodEnd(invoice),
        );
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const customerId = this.getCustomerId(invoice.customer);
      if (customerId) {
        await this.subscriptionsService.handlePaymentFailed(customerId);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      await this.subscriptionsService.cancelByStripeSubscription(
        String(subscription.id),
        this.getCustomerId(subscription.customer),
      );
    }

    return { received: true };
  }

  private constructEvent(rawBody: Buffer | undefined, signature: string | undefined) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('STRIPE_WEBHOOK_SECRET is not configured');
    }
    if (!rawBody || !signature) {
      throw new UnauthorizedException('Missing Stripe webhook signature');
    }

    try {
      return this.getStripe().webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new UnauthorizedException('Invalid Stripe webhook signature');
    }
  }

  private getStripe(): StripeWebhookClient {
    if (this.stripeClient) {
      return this.stripeClient;
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new InternalServerErrorException('STRIPE_SECRET_KEY is not configured');
    }

    this.stripeClient = new StripeConstructor(secretKey) as unknown as StripeWebhookClient;
    return this.stripeClient;
  }

  private getCustomerId(customer: unknown) {
    if (!customer) {
      return undefined;
    }
    if (typeof customer === 'string') {
      return customer;
    }
    return (customer as { id?: string }).id;
  }

  private getInvoicePriceId(invoice: Record<string, unknown>) {
    const firstLine = ((invoice.lines as { data?: Record<string, unknown>[] } | undefined)?.data ?? [])[0];
    return ((firstLine?.pricing as { price_details?: { price?: string } } | undefined)?.price_details?.price)
      ?? (firstLine?.price as { id?: string } | undefined)?.id;
  }

  private getInvoicePeriodEnd(invoice: Record<string, unknown>) {
    const firstLine = ((invoice.lines as { data?: Record<string, unknown>[] } | undefined)?.data ?? [])[0];
    const periodEnd = (firstLine?.period as { end?: number } | undefined)?.end;
    return periodEnd ? new Date(periodEnd * 1000) : null;
  }
}
