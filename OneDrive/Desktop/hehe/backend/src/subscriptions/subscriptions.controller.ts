import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { SubscriptionsService } from './subscriptions.service';

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  listPlans() {
    return this.subscriptionsService.listPlans();
  }

  @Get()
  getSubscription(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.subscriptionsService.getSubscription(req.user.team_id);
  }

  @Post('checkout')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async createCheckoutSession(
    @Req() req: { user: AuthenticatedRequestUser },
    @Body() body: { teamId?: string; priceId?: string },
  ) {
    const teamId = body.teamId ?? req.user.team_id;
    const sessionUrl = await this.subscriptionsService.createCheckoutSession(
      teamId,
      body.priceId,
    );
    return { sessionUrl };
  }
}
