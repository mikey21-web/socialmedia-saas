import {
  Body,
  Controller,
  Headers,
  HttpCode,
  InternalServerErrorException,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { AnalyticsService } from '../analytics/analytics.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('twitter')
  @HttpCode(200)
  async handleTwitterWebhook(
    @Body() body: Record<string, unknown>,
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-twitter-webhook-signature') signature?: string,
  ) {
    this.verifySignature(req.rawBody, signature, process.env.TWITTER_WEBHOOK_SECRET);
    await this.analyticsService.recordEvent({
      platform: 'twitter',
      externalId: String(body.tweet_id ?? body.external_id ?? ''),
      metric: String(body.event_type ?? 'webhook_event'),
      value: Number(body.value ?? 1),
    });
    return { ok: true };
  }

  @Post('instagram')
  @HttpCode(200)
  async handleInstagramWebhook(
    @Body() body: Record<string, unknown>,
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
    this.verifySignature(req.rawBody, signature, process.env.INSTAGRAM_WEBHOOK_SECRET);
    await this.analyticsService.recordEvent({
      platform: 'instagram',
      externalId: String(body.media_id ?? body.external_id ?? ''),
      metric: String(body.event_type ?? 'webhook_event'),
      value: Number(body.value ?? 1),
    });
    return { ok: true };
  }

  @Post('linkedin')
  @HttpCode(200)
  async handleLinkedInWebhook(
    @Body() body: Record<string, unknown>,
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-linkedin-signature') signature?: string,
  ) {
    this.verifySignature(req.rawBody, signature, process.env.LINKEDIN_WEBHOOK_SECRET);
    await this.analyticsService.recordEvent({
      platform: 'linkedin',
      externalId: String(body.post_id ?? body.external_id ?? ''),
      metric: String(body.event_type ?? 'webhook_event'),
      value: Number(body.value ?? 1),
    });
    return { ok: true };
  }

  @Post('facebook')
  @HttpCode(200)
  async handleFacebookWebhook(
    @Body() body: Record<string, unknown>,
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
    this.verifySignature(req.rawBody, signature, process.env.FACEBOOK_WEBHOOK_SECRET);
    await this.analyticsService.recordEvent({
      platform: 'facebook',
      externalId: String(body.post_id ?? body.external_id ?? ''),
      metric: String(body.event_type ?? 'webhook_event'),
      value: Number(body.value ?? 1),
    });
    return { ok: true };
  }

  private verifySignature(
    rawBody: Buffer | undefined,
    signatureHeader: string | undefined,
    secret: string | undefined,
  ) {
    if (!secret) {
      throw new InternalServerErrorException('Webhook secret is not configured');
    }
    if (!signatureHeader || !rawBody) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const digest = createHmac('sha256', secret).update(rawBody).digest('hex');
    const provided = signatureHeader.replace(/^sha256=/, '');

    const expectedBuffer = Buffer.from(digest, 'hex');
    const providedBuffer = Buffer.from(provided, 'hex');
    if (
      expectedBuffer.length !== providedBuffer.length
      || !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }
}
