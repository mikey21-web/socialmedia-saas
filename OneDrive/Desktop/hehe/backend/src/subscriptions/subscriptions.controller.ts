import { BadRequestException, Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { SubscriptionsService } from './subscriptions.service';
import { AgencyTier } from '../agency/agency-tiers.config';

type RawBodyRequest = Request & { rawBody?: Buffer; body: Buffer | Record<string, unknown> };

@Controller(['subscriptions', 'api/subscriptions'])
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('plans')
  listPlans() {
    return this.subscriptionsService.listPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get('tiers')
  listTiers() {
    return this.subscriptionsService.listTiers();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getSubscription(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.subscriptionsService.getSubscription(req.user.team_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  getStatus(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.subscriptionsService.getSubscriptionStatus(req.user.team_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('usage')
  getUsage(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.subscriptionsService.getUsage(req.user.team_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  createCheckoutSession(
    @Req() req: { user: AuthenticatedRequestUser },
    @Body() body: { tier?: AgencyTier },
  ) {
    return this.subscriptionsService.createCheckoutSession(
      req.user.team_id,
      req.user.userId,
      body.tier ?? 'pro',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('portal')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  createBillingPortalSession(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.subscriptionsService.createBillingPortalSession(req.user.team_id);
  }

  @Post('webhook')
  @Throttle({ default: { limit: 1000, ttl: 60000 } })
  handleWebhook(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }
    const body = Buffer.isBuffer(req.body) ? req.body : req.rawBody ?? Buffer.from('');
    return this.subscriptionsService.handleWebhook(body, signature);
  }
}
