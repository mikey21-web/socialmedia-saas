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
});
