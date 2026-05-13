import { Test, TestingModule } from '@nestjs/testing';
import { CopywriterService } from '../copywriter.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { LlmService } from '../../../../agents/llm/llm.service';
import { AgentRunLoggerService } from '../../../agent-run-logger.service';
import { HumanizerService } from '../../../../ai/humanizer/humanizer.service';
import { DesignerService } from '../../designer/designer.service';

describe('CopywriterService', () => {
  let service: CopywriterService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let llm: { completeJson: jest.Mock };
  let runLogger: { log: jest.Mock };
  let humanizer: { humanize: jest.Mock };
  let designer: { generateImage: jest.Mock };

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
    designer = { generateImage: jest.fn().mockResolvedValue({ url: 'https://cdn.example.com/image.png' }) };
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
        { provide: DesignerService, useValue: designer },
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

  it('throws when brand voice is missing', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(null);

    await expect(service.generatePost({
      teamId: 'team_1',
      brandVoiceId: 'missing',
      platform: 'instagram',
      pillarTopic: 'Tips',
      contentType: 'educational',
    })).rejects.toThrow('Brand voice not found');
  });

  it('adds trend context when trend signal is provided', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(mockBrandVoice);
    prisma.trendSignal.findUnique.mockResolvedValue({ value: '#AI', signalType: 'hashtag', platform: 'x', popularity: 90 });
    llm.completeJson
      .mockResolvedValueOnce({ content: 'Use the trend', hashtags: ['#AI'] })
      .mockResolvedValueOnce({ score: 85, feedback: [] });

    await service.generatePost({
      teamId: 'team_1',
      brandVoiceId: 'bv_1',
      platform: 'x',
      pillarTopic: 'Trends',
      contentType: 'trending',
      trendSignalId: 'trend_1',
    });

    expect(llm.completeJson.mock.calls[0][0]).toContain('Trending now: #AI');
  });

  it('includes brand vocabulary in the LLM prompt', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(mockBrandVoice);
    llm.completeJson
      .mockResolvedValueOnce({ content: 'Growth post', hashtags: ['#growth'] })
      .mockResolvedValueOnce({ score: 90, feedback: [] });

    await service.generatePost({
      teamId: 'team_1',
      brandVoiceId: 'bv_1',
      platform: 'linkedin',
      pillarTopic: 'Growth',
      contentType: 'educational',
    });

    expect(llm.completeJson.mock.calls[0][0]).toContain('scale, growth, leverage');
  });

  it('passes tone dimensions to humanizer', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(mockBrandVoice);
    llm.completeJson
      .mockResolvedValueOnce({ content: 'Growth post', hashtags: ['#growth'] })
      .mockResolvedValueOnce({ score: 90, feedback: [] });

    await service.generatePost({
      teamId: 'team_1',
      brandVoiceId: 'bv_1',
      platform: 'linkedin',
      pillarTopic: 'Growth',
      contentType: 'educational',
    });

    expect(humanizer.humanize).toHaveBeenCalledWith('Growth post', expect.objectContaining({
      toneDimensions: mockBrandVoice.toneAttributes,
    }));
  });

  it('retries generation when voice score is too low', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(mockBrandVoice);
    llm.completeJson
      .mockResolvedValueOnce({ content: 'Weak post', hashtags: ['#growth'] })
      .mockResolvedValueOnce({ score: 50, feedback: ['Too flat'] })
      .mockResolvedValueOnce({ content: 'Better post', hashtags: ['#growth'] })
      .mockResolvedValueOnce({ score: 82, feedback: [] });

    const result = await service.generatePost({
      teamId: 'team_1',
      brandVoiceId: 'bv_1',
      platform: 'instagram',
      pillarTopic: 'Growth',
      contentType: 'educational',
    });

    expect(result.content).toBe('Better post');
    expect(humanizer.humanize).toHaveBeenCalledTimes(2);
  });

  it('returns final attempt when all voice scores stay low', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(mockBrandVoice);
    llm.completeJson
      .mockResolvedValueOnce({ content: 'Attempt 1', hashtags: ['#one'] })
      .mockResolvedValueOnce({ score: 40, feedback: ['Low'] })
      .mockResolvedValueOnce({ content: 'Attempt 2', hashtags: ['#two'] })
      .mockResolvedValueOnce({ score: 50, feedback: ['Low'] })
      .mockResolvedValueOnce({ content: 'Attempt 3', hashtags: ['#three'] })
      .mockResolvedValueOnce({ score: 60, feedback: ['Low'] });

    const result = await service.generatePost({
      teamId: 'team_1',
      brandVoiceId: 'bv_1',
      platform: 'instagram',
      pillarTopic: 'Growth',
      contentType: 'educational',
    });

    expect(result.content).toBe('Attempt 3');
    expect(result.voiceMatchScore).toBe(60);
  });

  it('crossPlatformAdapt humanizes each returned platform', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(mockBrandVoice);
    llm.completeJson.mockResolvedValue({ x: 'Tweet', linkedin: 'Post' });

    await service.crossPlatformAdapt({
      teamId: 'team_1',
      sourceContent: 'Original',
      sourcePlatform: 'instagram',
      targetPlatforms: ['x', 'linkedin'],
      brandVoiceId: 'bv_1',
    });

    expect(humanizer.humanize).toHaveBeenCalledTimes(2);
  });

  it('crossPlatformAdapt skips missing platform keys', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(mockBrandVoice);
    llm.completeJson.mockResolvedValue({ x: 'Tweet only' });

    const result = await service.crossPlatformAdapt({
      teamId: 'team_1',
      sourceContent: 'Original',
      sourcePlatform: 'instagram',
      targetPlatforms: ['x', 'linkedin'],
      brandVoiceId: 'bv_1',
    });

    expect(result).toEqual({ x: 'Tweet only' });
  });

  it('generateVariants adjusts target word count per variant', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(mockBrandVoice);
    llm.completeJson
      .mockResolvedValueOnce({ content: 'Variant 1', hashtags: [] })
      .mockResolvedValueOnce({ score: 90, feedback: [] })
      .mockResolvedValueOnce({ content: 'Variant 2', hashtags: [] })
      .mockResolvedValueOnce({ score: 90, feedback: [] });

    await service.generateVariants({
      teamId: 'team_1',
      brandVoiceId: 'bv_1',
      platform: 'instagram',
      pillarTopic: 'Tips',
      contentType: 'educational',
      targetWordCount: 100,
    }, 2);

    expect(llm.completeJson.mock.calls[0][0]).toContain('Target length: 90 words');
    expect(llm.completeJson.mock.calls[2][0]).toContain('Target length: 100 words');
  });

  it('scoreVoiceMatch returns zero feedback when brand voice is missing', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(null);
    await expect(service.scoreVoiceMatch('missing', 'content')).resolves.toEqual({
      score: 0,
      feedback: ['Brand voice not found'],
    });
  });

  it('generateFullPost starts design generation in background', async () => {
    prisma.brandVoice.findUnique.mockResolvedValue(mockBrandVoice);
    llm.completeJson
      .mockResolvedValueOnce({ content: 'Post with image', hashtags: [], imagePrompt: 'chart', style: 'graphic', aspectRatio: '1:1' })
      .mockResolvedValueOnce({ score: 90, feedback: [] });

    const result = await service.generateFullPost('team_1', {
      brandVoiceId: 'bv_1',
      platform: 'instagram',
      pillarTopic: 'Growth',
      contentType: 'educational',
      topic: 'Growth',
    });

    expect(result.imageGenerationStarted).toBe(true);
    expect(designer.generateImage).toHaveBeenCalled();
  });
});
