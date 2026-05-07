import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthenticatedRequestUser } from '../interfaces/authenticated-request-user.interface';
import { TeamsService } from '../../teams/teams.service';

export const SUBSCRIPTION_FEATURE_KEY = 'subscriptionFeature';
export type SubscriptionFeature = 'posts' | 'analytics' | 'platforms' | 'members';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const feature = this.reflector.getAllAndOverride<SubscriptionFeature>(
      SUBSCRIPTION_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!feature) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & {
      user?: AuthenticatedRequestUser;
    }>();
    const teamId = request.user?.team_id;
    if (!teamId) {
      throw new ForbiddenException('Team context is required');
    }

    const plan = await this.teamsService.getTeamPlan(teamId);
    if (plan === 'pro') {
      return true;
    }

    if (feature === 'posts') {
      const count = await this.teamsService.getMonthlyScheduledPostCount(teamId);
      if (count >= 10) {
        throw this.upgradeRequired('posts', count, 10);
      }
    }

    if (feature === 'platforms') {
      const count = await this.teamsService.getPlatformCredentialCount(teamId);
      if (count >= 3) {
        throw this.upgradeRequired('platforms', count, 3);
      }
    }

    if (feature === 'members') {
      const count = await this.teamsService.getTeamMemberCount(teamId);
      if (count >= 2) {
        throw this.upgradeRequired('members', count, 2);
      }
    }

    if (feature === 'analytics') {
      const count = await this.teamsService.getMonthlyAnalyticsEventCount(teamId);
      if (count >= 100) {
        throw new ForbiddenException('Free plan is limited to 100 analytics events per month');
      }
    }

    return true;
  }

  private upgradeRequired(limit: 'posts' | 'platforms' | 'members', current: number, max: number) {
    return new ForbiddenException({
      code: 'UPGRADE_REQUIRED',
      limit,
      current,
      max,
    });
  }
}
