import { Test, TestingModule } from '@nestjs/testing';
import { StrategistService } from '../strategist.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { LlmService } from '../../../../agents/llm/llm.service';
import { AgentRunLoggerService } from '../../../agent-run-logger.service';

describe('StrategistService', () => {
  let service: StrategistService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let llm: { completeJson: jest.Mock };
  let runLogger: { log: jest.Mock };

  beforeEach(async () => {
    prisma = {
      brandVoice: { findUnique: jest.fn() },
      verticalProfile: { findUnique: jest.fn() },
      post: { findMany: jest.fn() },
      contentStrategy: {
        create: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };
    llm = { completeJson: jest.fn() };
    runLogger = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrategistService,
        { provide: PrismaService, useValue: prisma },
        { provide: LlmService, useValue: llm },
        { provide: AgentRunLoggerService, useValue: runLogger },
      ],
    }).compile();

    service = module.get(StrategistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generateStrategy should create a 90-day plan', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue({
      name: 'TestBrand',
      toneAttributes: { formality: 5, energy: 6 },
    });
    prisma.verticalProfile.findUnique.mockResolvedValue({
      name: 'D2C',
      contentPriorities: { showcases: 40 },
    });
    prisma.post.findMany.mockResolvedValue([]);

    llm.completeJson.mockResolvedValue({
      name: 'Q2 Growth Strategy',
      contentMix: { educational: 50, promotional: 30, trending: 20 },
      pillars: [{ topic: 'Product Showcases', percentage: 40, examples: ['example1'] }],
      postingCadence: { instagram: 'daily' },
      campaignPlan: [{ name: 'Launch Campaign', dates: 'May 2026', theme: 'New arrivals', postsCount: 15 }],
    });

    prisma.contentStrategy.create.mockResolvedValue({
      id: 'strat_1',
      name: 'Q2 Growth Strategy',
      status: 'active',
    });

    const result = await service.generateStrategy({
      teamId: 'team_1',
      brandVoiceId: 'bv_1',
      verticalSlug: 'd2c',
      goals: { followers: 1000, engagement: 5 },
      platforms: ['instagram', 'x'],
      durationDays: 90,
    });

    expect(result.id).toBe('strat_1');
    expect(prisma.contentStrategy.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          teamId: 'team_1',
          status: 'active',
        }),
      }),
    );
    expect(runLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({ agentRole: 'strategist', status: 'success' }),
    );
  });

  it('listStrategies should return strategies for a team', async () => {
    prisma.contentStrategy.findMany.mockResolvedValue([
      { id: 'strat_1', name: 'Strategy 1', status: 'active' },
    ]);

    const result = await service.listStrategies('team_1');
    expect(result).toHaveLength(1);
    expect(prisma.contentStrategy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teamId: 'team_1' } }),
    );
  });

  it('generateStrategy defaults to 90 days when duration is omitted', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(null);
    prisma.verticalProfile.findUnique.mockResolvedValue(null);
    prisma.post.findMany.mockResolvedValue([]);
    llm.completeJson.mockResolvedValue({ name: '', contentMix: {}, pillars: [], postingCadence: {}, campaignPlan: [] });
    prisma.contentStrategy.create.mockResolvedValue({ id: 'strat_default' });

    await service.generateStrategy({
      teamId: 'team_1',
      brandVoiceId: 'bv_1',
      verticalSlug: 'generic',
      goals: {},
      platforms: ['instagram'],
    });

    expect(prisma.contentStrategy.create.mock.calls[0][0].data.name).toBe('90-Day Strategy');
  });

  it('generateStrategy stores selected platforms only', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(null);
    prisma.verticalProfile.findUnique.mockResolvedValue(null);
    prisma.post.findMany.mockResolvedValue([]);
    llm.completeJson.mockResolvedValue({ name: 'Platform plan', contentMix: {}, pillars: [], postingCadence: {}, campaignPlan: [] });
    prisma.contentStrategy.create.mockResolvedValue({ id: 'strat_platforms' });

    await service.generateStrategy({
      teamId: 'team_1',
      brandVoiceId: 'bv_1',
      verticalSlug: 'generic',
      goals: {},
      platforms: ['linkedin', 'instagram'],
      durationDays: 30,
    });

    expect(prisma.contentStrategy.create.mock.calls[0][0].data.platforms).toEqual(['linkedin', 'instagram']);
  });

  it('generateStrategy includes goals in persisted strategy', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(null);
    prisma.verticalProfile.findUnique.mockResolvedValue(null);
    prisma.post.findMany.mockResolvedValue([]);
    llm.completeJson.mockResolvedValue({ name: 'Goal plan', contentMix: {}, pillars: [], postingCadence: {}, campaignPlan: [] });
    prisma.contentStrategy.create.mockResolvedValue({ id: 'strat_goals' });

    await service.generateStrategy({
      teamId: 'team_1',
      brandVoiceId: 'bv_1',
      verticalSlug: 'generic',
      goals: { followers: 500, leads: 25 },
      platforms: ['x'],
      durationDays: 30,
    });

    expect(prisma.contentStrategy.create.mock.calls[0][0].data.goals).toEqual({ followers: 500, leads: 25 });
  });

  it('generateStrategy prompt includes recent post performance context', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(null);
    prisma.verticalProfile.findUnique.mockResolvedValue(null);
    prisma.post.findMany.mockResolvedValue([{ title: 'High converting reel', content: 'body', impressions: 1000, reach: 700 }]);
    llm.completeJson.mockResolvedValue({ name: 'Recent plan', contentMix: {}, pillars: [], postingCadence: {}, campaignPlan: [] });
    prisma.contentStrategy.create.mockResolvedValue({ id: 'strat_recent' });

    await service.generateStrategy({
      teamId: 'team_1',
      brandVoiceId: 'bv_1',
      verticalSlug: 'generic',
      goals: {},
      platforms: ['instagram'],
      durationDays: 30,
    });

    expect(llm.completeJson.mock.calls[0][0]).toContain('High converting reel');
  });

  it('generateStrategy logs successful run output', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(null);
    prisma.verticalProfile.findUnique.mockResolvedValue(null);
    prisma.post.findMany.mockResolvedValue([]);
    llm.completeJson.mockResolvedValue({ name: 'Logged plan', contentMix: {}, pillars: [], postingCadence: {}, campaignPlan: [] });
    prisma.contentStrategy.create.mockResolvedValue({ id: 'strat_logged' });

    await service.generateStrategy({
      teamId: 'team_1',
      brandVoiceId: 'bv_1',
      verticalSlug: 'generic',
      goals: {},
      platforms: ['instagram'],
      durationDays: 30,
    });

    expect(runLogger.log).toHaveBeenCalledWith(expect.objectContaining({ output: { strategyId: 'strat_logged' } }));
  });

  it('getCurrentStrategy returns null when no active strategy exists', async () => {
    prisma.contentStrategy.findFirst.mockResolvedValue(null);
    await expect(service.getCurrentStrategy('team_1')).resolves.toBeNull();
  });

  it('getCurrentStrategy returns latest active strategy', async () => {
    prisma.contentStrategy.findFirst.mockResolvedValue({ id: 'strat_latest', status: 'active' });
    const result = await service.getCurrentStrategy('team_1');
    expect(result).toEqual({ id: 'strat_latest', status: 'active' });
    expect(prisma.contentStrategy.findFirst).toHaveBeenCalledWith({
      where: { teamId: 'team_1', status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('generateWeeklyBriefs returns briefs from the LLM', async () => {
    prisma.contentStrategy.findUniqueOrThrow.mockResolvedValue({
      id: 'strat_1',
      pillars: [{ topic: 'Education' }],
      postingCadence: { instagram: 'daily' },
      platforms: ['instagram'],
    });
    llm.completeJson.mockResolvedValue({ briefs: [{ date: '2026-05-09', platform: 'instagram', pillarTopic: 'Education', contentType: 'educational' }] });

    const briefs = await service.generateWeeklyBriefs('strat_1');
    expect(briefs).toHaveLength(1);
    expect(briefs[0].platform).toBe('instagram');
  });

  it('generateWeeklyBriefs handles missing briefs array', async () => {
    prisma.contentStrategy.findUniqueOrThrow.mockResolvedValue({
      id: 'strat_1',
      pillars: [],
      postingCadence: {},
      platforms: ['x'],
    });
    llm.completeJson.mockResolvedValue({});

    await expect(service.generateWeeklyBriefs('strat_1')).resolves.toEqual([]);
  });

  it('getDailyBriefs returns only today briefs', async () => {
    const today = new Date().toISOString().slice(0, 10);
    jest.spyOn(service, 'generateWeeklyBriefs').mockResolvedValue([
      { date: today, platform: 'instagram', pillarTopic: 'Today', contentType: 'educational' } as never,
      { date: '1999-01-01', platform: 'x', pillarTopic: 'Old', contentType: 'promotional' } as never,
    ]);

    const briefs = await service.getDailyBriefs('strat_1');
    expect(briefs).toHaveLength(1);
    expect(briefs[0].pillarTopic).toBe('Today');
  });

  it('refineStrategy updates strategy JSON fields', async () => {
    prisma.contentStrategy.findUniqueOrThrow.mockResolvedValue({
      id: 'strat_1',
      teamId: 'team_1',
      pillars: [],
      contentMix: {},
      campaignPlan: [],
    });
    prisma.post.findMany.mockResolvedValue([]);
    llm.completeJson.mockResolvedValue({
      contentMix: { educational: 60 },
      pillars: [{ topic: 'Proof', percentage: 40, examples: ['case study'] }],
      campaignPlan: [{ name: 'May', dates: 'May', theme: 'Proof', postsCount: 4 }],
    });
    prisma.contentStrategy.update.mockResolvedValue({ id: 'strat_1', contentMix: { educational: 60 } });

    const result = await service.refineStrategy('strat_1');
    expect(result.contentMix).toEqual({ educational: 60 });
    expect(prisma.contentStrategy.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'strat_1' } }));
  });

  it('listStrategies sorts by newest first', async () => {
    prisma.contentStrategy.findMany.mockResolvedValue([]);
    await service.listStrategies('team_1');
    expect(prisma.contentStrategy.findMany).toHaveBeenCalledWith({
      where: { teamId: 'team_1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});
