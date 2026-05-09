import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedRequestUser } from '../interfaces/authenticated-request-user.interface';
import { AGENCY_TIERS, AgencyTier } from '../../agency/agency-tiers.config';

export type PlanLimitResource =
  | 'posts'
  | 'ai_images'
  | 'accounts'
  | 'ai_runs'
  | 'carousels'
  | 'brand_voice_profiles'
  | 'reports';

// ─── Decorator ───────────────────────────────────────────────────────────────

export const PLAN_LIMIT_KEY = 'planLimitResource';

/**
 * Apply to a controller method or class to enforce plan-based resource limits.
 *
 * @example
 * \@PlanLimit('posts')
 * \@Post()
 * async createPost() { ... }
 */
export const PlanLimit = (resource: PlanLimitResource) =>
  SetMetadata(PLAN_LIMIT_KEY, resource);

// ─── Guard ────────────────────────────────────────────────────────────────────

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.getAllAndOverride<PlanLimitResource | undefined>(
      PLAN_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!resource) {
      // No @PlanLimit decorator — allow through
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & {
      user?: AuthenticatedRequestUser;
    }>();

    const teamId = request.user?.team_id;
    if (!teamId) {
      throw new ForbiddenException('Team context is required');
    }

    const plan = await this.resolveTeamPlan(teamId);
    const limits = AGENCY_TIERS[plan].features;

    if ('unlimited' in limits && limits.unlimited) {
      return true;
    }

    switch (resource) {
      case 'posts':
        return this.checkCount({
          teamId,
          resource,
          current: await this.countPostsThisMonth(teamId),
          max: limits.postsPerMonth,
          message: `Your plan allows ${limits.postsPerMonth} posts per month. Upgrade to schedule more.`,
        });

      case 'ai_images':
        return this.checkCount({
          teamId,
          resource,
          current: await this.countGeneratedMediaThisMonth(teamId),
          max: limits.carouselsPerMonth,
          message: `Your plan allows ${limits.carouselsPerMonth} generated creative assets per month. Upgrade for more.`,
        });

      case 'accounts':
        return this.checkCount({
          teamId,
          resource,
          current: await this.prisma.platformCredential.count({ where: { teamId } }),
          max: limits.platformsPerAccount,
          message: `Your plan allows ${limits.platformsPerAccount} connected accounts. Upgrade to connect more.`,
        });

      case 'ai_runs':
        return this.checkCount({
          teamId,
          resource,
          current: await this.countAiRunsToday(teamId),
          max: limits.aiRunsPerDay,
          message: `Your plan allows ${limits.aiRunsPerDay} AI runs per day. Upgrade for more.`,
        });

      case 'carousels':
        return this.checkCount({
          teamId,
          resource,
          current: await this.countCarouselsThisMonth(teamId),
          max: limits.carouselsPerMonth,
          message: `Your plan allows ${limits.carouselsPerMonth} carousels per month. Upgrade for more.`,
        });

      case 'brand_voice_profiles':
        return this.checkCount({
          teamId,
          resource,
          current: await this.prisma.brandVoiceProfile.count({ where: { teamId } }),
          max: limits.brandVoiceProfiles,
          message: `Your plan allows ${limits.brandVoiceProfiles} brand voice profiles. Upgrade for more.`,
        });

      case 'reports':
        return this.checkCount({
          teamId,
          resource,
          current: await this.countReportsThisWeek(teamId),
          max: limits.reportsPerWeek,
          message: `Your plan allows ${limits.reportsPerWeek} reports per week. Upgrade for more.`,
        });

      default:
        return true;
    }
  }

  // ─── Per-resource checks ────────────────────────────────────────────────────

  private checkCount(input: {
    teamId: string;
    resource: PlanLimitResource;
    current: number;
    max: number;
    message: string;
  }): boolean {
    if (input.current >= input.max) {
      throw new ForbiddenException({
        code: 'PLAN_LIMIT_EXCEEDED',
        resource: input.resource,
        current: input.current,
        max: input.max,
        message: input.message,
      });
    }
    return true;
  }

  private async countPostsThisMonth(teamId: string): Promise<number> {
    return this.prisma.post.count({
      where: {
        teamId,
        deletedAt: null,
        status: { in: ['scheduled', 'published', 'partial', 'publishing'] },
        createdAt: { gte: this.getMonthStart() },
      },
    });
  }

  private async countGeneratedMediaThisMonth(teamId: string): Promise<number> {
    return this.prisma.mediaAsset.count({
      where: {
        teamId,
        source: 'generated',
        createdAt: { gte: this.getMonthStart() },
      },
    });
  }

  private async countAiRunsToday(teamId: string): Promise<number> {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    return this.prisma.agentRunLog.count({
      where: { teamId, createdAt: { gte: dayStart } },
    });
  }

  private async countCarouselsThisMonth(teamId: string): Promise<number> {
    return this.prisma.carousel.count({
      where: { teamId, createdAt: { gte: this.getMonthStart() } },
    });
  }

  private async countReportsThisWeek(teamId: string): Promise<number> {
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.prisma.report.count({
      where: { teamId, generatedAt: { gte: weekStart } },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async resolveTeamPlan(teamId: string): Promise<AgencyTier> {
    const [subscription, team] = await Promise.all([
      this.prisma.subscription.findUnique({
        where: { teamId },
        select: { plan: true, status: true },
      }),
      this.prisma.team.findUnique({
        where: { id: teamId },
        select: { agencyTier: true },
      }),
    ]);

    const activeStatuses = new Set(['active', 'trialing']);
    const plan = subscription && activeStatuses.has(subscription.status)
      ? subscription.plan
      : team?.agencyTier;

    if (plan && Object.prototype.hasOwnProperty.call(AGENCY_TIERS, plan)) {
      return plan as AgencyTier;
    }

    return 'solo';
  }

  private getMonthStart(): Date {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
