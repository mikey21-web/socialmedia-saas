import { Test, TestingModule } from '@nestjs/testing';
import { BrandVoiceTrainerService } from '../brand-voice/brand-voice-trainer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmService } from '../../agents/llm/llm.service';
import { AgentRunLoggerService } from '../agent-run-logger.service';

describe('BrandVoiceTrainerService', () => {
  let service: BrandVoiceTrainerService;
  let prisma: { brandVoice: { create: jest.Mock; findUniqueOrThrow: jest.Mock; update: jest.Mock; findMany: jest.Mock }; post: { findMany: jest.Mock } };
  let llm: { completeJson: jest.Mock };
  let runLogger: { log: jest.Mock };

  beforeEach(async () => {
    prisma = {
      brandVoice: {
        create: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      post: { findMany: jest.fn() },
    };
    llm = { completeJson: jest.fn() };
    runLogger = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandVoiceTrainerService,
        { provide: PrismaService, useValue: prisma },
        { provide: LlmService, useValue: llm },
        { provide: AgentRunLoggerService, useValue: runLogger },
      ],
    }).compile();

    service = module.get(BrandVoiceTrainerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('trainFromPosts should analyze posts and create brand voice', async () => {
    llm.completeJson.mockResolvedValue({
      formality: 6,
      energy: 7,
      humor: 2,
      professionalism: 8,
      vocabulary: ['leverage', 'scale', 'growth'],
      avoidPhrases: ['basically', 'stuff'],
      emojiUsage: 'minimal',
      sentenceStyle: 'varied',
    });

    prisma.brandVoice.create.mockResolvedValue({
      id: 'bv_1',
      name: 'TestBrand',
      toneAttributes: { formality: 6, energy: 7, humor: 2, professionalism: 8 },
    });

    const result = await service.trainFromPosts({
      teamId: 'team_1',
      brandName: 'TestBrand',
      brandDescription: 'A test brand',
      posts: [
        { platform: 'instagram', content: 'Great post about scaling', engagement: 100 },
        { platform: 'x', content: 'Growth tips for startups', engagement: 80 },
      ],
    });

    expect(result.id).toBe('bv_1');
    expect(llm.completeJson).toHaveBeenCalledTimes(1);
    expect(prisma.brandVoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          teamId: 'team_1',
          name: 'TestBrand',
        }),
      }),
    );
    expect(runLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        agentRole: 'brand_voice_trainer',
        status: 'success',
      }),
    );
  });

  it('scoreVoiceMatch should return score and feedback', async () => {
    prisma.brandVoice.findUniqueOrThrow.mockResolvedValue({
      id: 'bv_1',
      name: 'TestBrand',
      toneAttributes: { formality: 5, energy: 5, humor: 3, professionalism: 7 },
      vocabulary: ['growth', 'scale'],
      emojiUsage: 'moderate',
      sentenceStyle: 'short',
    });

    llm.completeJson.mockResolvedValue({
      score: 82,
      feedback: ['Good energy match', 'Could use more industry terms'],
    });

    const result = await service.scoreVoiceMatch('bv_1', 'Test draft content');
    expect(result.score).toBe(82);
    expect(result.feedback).toHaveLength(2);
  });
});
