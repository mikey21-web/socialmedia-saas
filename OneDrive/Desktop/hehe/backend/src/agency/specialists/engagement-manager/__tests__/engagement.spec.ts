import { Test, TestingModule } from '@nestjs/testing';
import { EngagementManagerService } from '../engagement-manager.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { LlmService } from '../../../../agents/llm/llm.service';
import { AgentRunLoggerService } from '../../../agent-run-logger.service';
import { HumanizerService } from '../../../../ai/humanizer/humanizer.service';

describe('EngagementManagerService', () => {
  let service: EngagementManagerService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let llm: { completeJson: jest.Mock; complete: jest.Mock };
  let runLogger: { log: jest.Mock };
  let humanizer: { humanize: jest.Mock };

  beforeEach(async () => {
    prisma = {
      team: { findUnique: jest.fn() },
      brandVoice: { findFirst: jest.fn(), findUnique: jest.fn() },
      engagementAction: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };
    llm = {
      completeJson: jest.fn(),
      complete: jest.fn(),
    };
    runLogger = { log: jest.fn() };
    humanizer = {
      humanize: jest.fn(async (text: string) => ({
        original: text,
        humanized: text.replace('sincerely ', ''),
        detections: [],
        aiScore: 20,
        finalAiScore: 8,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EngagementManagerService,
        { provide: PrismaService, useValue: prisma },
        { provide: LlmService, useValue: llm },
        { provide: AgentRunLoggerService, useValue: runLogger },
        { provide: HumanizerService, useValue: humanizer },
      ],
    }).compile();

    service = module.get(EngagementManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('processIncomingMessage should classify intent and generate reply', async () => {
    prisma.team.findUnique.mockResolvedValue({ agencyTier: 'pro' });
    prisma.brandVoice.findFirst.mockResolvedValue({
      id: 'bv_1',
      name: 'TestBrand',
      toneAttributes: { formality: 5, energy: 5 },
      emojiUsage: 'moderate',
      sentenceStyle: 'short',
    });
    prisma.brandVoice.findUnique.mockResolvedValue({
      id: 'bv_1',
      name: 'TestBrand',
      toneAttributes: { formality: 5, energy: 5 },
      emojiUsage: 'moderate',
      sentenceStyle: 'short',
    });

    llm.completeJson.mockResolvedValue({
      intent: 'buyer_inquiry',
      sentiment: 'positive',
      urgency: 'low',
    });
    llm.complete.mockResolvedValue('Thank you for your interest! Check out our latest products.');

    prisma.engagementAction.create.mockResolvedValue({
      id: 'ea_1',
      status: 'sent',
      sentiment: 'positive',
      intent: 'buyer_inquiry',
    });

    const result = await service.processIncomingMessage({
      teamId: 'team_1',
      platform: 'instagram',
      messageType: 'comment',
      content: 'Where can I buy this?',
      fromUser: 'customer123',
      postId: 'post_1',
    });

    expect(result.id).toBe('ea_1');
    expect(llm.completeJson).toHaveBeenCalledTimes(1);
    expect(llm.complete).toHaveBeenCalledTimes(1);
    expect(humanizer.humanize).toHaveBeenCalledWith(
      'Thank you for your interest! Check out our latest products.',
      expect.objectContaining({ platform: 'instagram' }),
    );
    expect(runLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({ agentRole: 'engagement_manager' }),
    );
  });

  it('should NOT auto-send when sentiment is negative', async () => {
    prisma.team.findUnique.mockResolvedValue({ agencyTier: 'pro' });
    prisma.brandVoice.findFirst.mockResolvedValue(null);

    llm.completeJson.mockResolvedValue({
      intent: 'complaint',
      sentiment: 'negative',
      urgency: 'high',
    });
    llm.complete.mockResolvedValue('We sincerely apologize for the inconvenience.');

    prisma.engagementAction.create.mockImplementation((args: { data: { status: string } }) => {
      return Promise.resolve({ ...args.data, id: 'ea_2' });
    });

    const result = await service.processIncomingMessage({
      teamId: 'team_1',
      platform: 'x',
      messageType: 'dm',
      content: 'This product is terrible!',
      fromUser: 'angry_user',
    });

    // Negative sentiment on pro tier should be pending, not auto-sent
    expect(prisma.engagementAction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'pending' }),
      }),
    );
  });

  it('approveAction should update status', async () => {
    prisma.engagementAction.update.mockResolvedValue({
      id: 'ea_1',
      status: 'approved',
      approvedBy: 'user_1',
    });

    const result = await service.approveAction('ea_1', 'user_1');
    expect(result.status).toBe('approved');
    expect(prisma.engagementAction.update).toHaveBeenCalledWith({
      where: { id: 'ea_1' },
      data: { status: 'approved', approvedBy: 'user_1' },
    });
  });
});
