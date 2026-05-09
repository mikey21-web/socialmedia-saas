import { Test, TestingModule } from '@nestjs/testing';
import { CopywriterService } from '../copywriter.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { LlmService } from '../../../../agents/llm/llm.service';
import { AgentRunLoggerService } from '../../../agent-run-logger.service';
import { HumanizerService } from '../../../../ai/humanizer/humanizer.service';

describe('CopywriterService', () => {
  let service: CopywriterService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let llm: { completeJson: jest.Mock };
  let runLogger: { log: jest.Mock };
  let humanizer: { humanize: jest.Mock };

  const mockBrandVoice = {
    id: 'bv_1',
    name: 'TestBrand',
    toneAttributes: { formality: 5, energy: 7, humor: 2, professionalism: 8 },
    vocabulary: ['scale', 'growth', 'leverage'],
    avoidPhrases: ['basically'],
    emojiUsage: 'moderate',
    sentenceStyle: 'short',
    trainingPosts: [
      { platform: 'instagram', content: 'Great post about scaling', engagement: 100 },
    ],
  };

  beforeEach(async () => {
    prisma = {
      brandVoice: { findUnique: jest.fn() },
      trendSignal: { findUnique: jest.fn() },
    };
    llm = { completeJson: jest.fn() };
    runLogger = { log: jest.fn() };
    humanizer = {
      humanize: jest.fn(async (content: string) => ({
        original: content,
        humanized: content.replace('leverage', 'use'),
        detections: [],
        aiScore: 20,
        finalAiScore: 10,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CopywriterService,
        { provide: PrismaService, useValue: prisma },
        { provide: LlmService, useValue: llm },
        { provide: AgentRunLoggerService, useValue: runLogger },
        { provide: HumanizerService, useValue: humanizer },
      ],
    }).compile();

    service = module.get(CopywriterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generatePost should produce content matching brand voice', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(mockBrandVoice);

    llm.completeJson
      .mockResolvedValueOnce({
      content: 'Scale your business with these 3 tips. #growth',
      hashtags: ['#growth', '#scale', '#startup'],
      cta: 'Save this for later!',
      imagePrompt: 'Minimalist growth chart illustration',
      style: 'graphic',
      aspectRatio: '1:1',
      })
      .mockResolvedValueOnce({
        score: 82,
        feedback: ['Good energy match'],
      });

    const result = await service.generatePost({
      teamId: 'team_1',
      brandVoiceId: 'bv_1',
      platform: 'instagram',
      pillarTopic: 'Business Growth',
      contentType: 'educational',
    });

    expect(result.content).toContain('Scale');
    expect(result.aiScore).toBe(20);
    expect(result.finalAiScore).toBe(10);
    expect(result.voiceMatchScore).toBe(82);
    expect(result.hashtags.length).toBeGreaterThan(0);
    expect(humanizer.humanize).toHaveBeenCalledWith(
      'Scale your business with these 3 tips. #growth',
      expect.objectContaining({ platform: 'instagram' }),
    );
    expect(runLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({ agentRole: 'copywriter', status: 'success' }),
    );
  });

  it('generateVariants should return multiple versions', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(mockBrandVoice);

    llm.completeJson
      .mockResolvedValueOnce({ content: 'Variant content 1', hashtags: ['#test'] })
      .mockResolvedValueOnce({ score: 80, feedback: [] })
      .mockResolvedValueOnce({ content: 'Variant content 2', hashtags: ['#test'] })
      .mockResolvedValueOnce({ score: 80, feedback: [] })
      .mockResolvedValueOnce({ content: 'Variant content 3', hashtags: ['#test'] })
      .mockResolvedValueOnce({ score: 80, feedback: [] });

    const result = await service.generateVariants(
      {
        teamId: 'team_1',
        brandVoiceId: 'bv_1',
        platform: 'instagram',
        pillarTopic: 'Tips',
        contentType: 'educational',
      },
      3,
    );

    expect(result).toHaveLength(3);
    expect(humanizer.humanize).toHaveBeenCalledTimes(3);
  });

  it('crossPlatformAdapt should adapt content for multiple platforms', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(mockBrandVoice);

    llm.completeJson.mockResolvedValue({
      x: 'Short tweet version',
      linkedin: 'Professional long-form version',
    });

    const result = await service.crossPlatformAdapt({
      teamId: 'team_1',
      sourceContent: 'Original Instagram post about growth',
      sourcePlatform: 'instagram',
      targetPlatforms: ['x', 'linkedin'],
      brandVoiceId: 'bv_1',
    });

    expect(result.x).toBeDefined();
    expect(result.linkedin).toBeDefined();
  });
});
