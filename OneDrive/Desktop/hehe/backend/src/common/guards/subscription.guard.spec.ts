import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { SubscriptionGuard } from './subscription.guard';
import { TeamsService } from '../../teams/teams.service';

const mockTeams = {
  getTeamPlan: jest.fn(),
  getDailyPostCount: jest.fn(),
  getMonthlyScheduledPostCount: jest.fn(),
  getMonthlyAnalyticsEventCount: jest.fn(),
};

const mockReflector = {
  getAllAndOverride: jest.fn(),
};

function context(body: Record<string, unknown> = {}, user = { team_id: 'team-1' }) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ body, user }),
    }),
  } as never;
}

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new SubscriptionGuard(
      mockTeams as unknown as TeamsService,
      mockReflector as unknown as Reflector,
    );
  });

  it('allows pro teams without checking usage limits', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('posts');
    mockTeams.getTeamPlan.mockResolvedValue('pro');

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(mockTeams.getDailyPostCount).not.toHaveBeenCalled();
  });

  it('blocks free teams after one post per day', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('posts');
    mockTeams.getTeamPlan.mockResolvedValue('free');
    mockTeams.getMonthlyScheduledPostCount.mockResolvedValue(30);

    await expect(guard.canActivate(context())).rejects.toThrow(ForbiddenException);
  });

  it('blocks free teams after 100 analytics events per month', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('analytics');
    mockTeams.getTeamPlan.mockResolvedValue('free');
    mockTeams.getMonthlyAnalyticsEventCount.mockResolvedValue(100);

    await expect(guard.canActivate(context())).rejects.toThrow(ForbiddenException);
  });

  it('allows free teams below limits', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('analytics');
    mockTeams.getTeamPlan.mockResolvedValue('free');
    mockTeams.getMonthlyAnalyticsEventCount.mockResolvedValue(99);

    await expect(guard.canActivate(context())).resolves.toBe(true);
  });
});
