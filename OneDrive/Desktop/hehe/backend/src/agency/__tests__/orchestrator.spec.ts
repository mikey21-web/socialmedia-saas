// Mock modules that transitively import puppeteer (not installed in dev)
jest.mock('../../media/media.service', () => ({
  MediaService: jest.fn().mockImplementation(() => ({ generateImage: jest.fn() })),
}));
jest.mock('../../publishing/publishing.service', () => ({
  PublishingService: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../../notifications/notifications.service', () => ({
  NotificationsService: jest.fn().mockImplementation(() => ({ create: jest.fn() })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AgencyOrchestratorService } from '../orchestrator/agency-orchestrator.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StrategistService } from '../specialists/strategist/strategist.service';
import { CopywriterService } from '../specialists/copywriter/copywriter.service';
import { DesignerService } from '../specialists/designer/designer.service';
import { AnalystService } from '../specialists/analyst/analyst.service';
import { EngagementManagerService } from '../specialists/engagement-manager/engagement-manager.service';
import { TrendMonitorService } from '../trends/trend-monitor.service';
import { PublishingService } from '../../publishing/publishing.service';
import { NotificationsService } from '../../notifications/notifications.service';

describe('AgencyOrchestratorService', () => {
  let service: AgencyOrchestratorService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const mockStrategist = {
    getCurrentStrategy: jest.fn(),
    refineStrategy: jest.fn(),
    getDailyBriefs: jest.fn(),
  };
  const mockCopywriter = { generatePost: jest.fn() };
  const mockDesigner = { generateImage: jest.fn() };
  const mockAnalyst = { generateDailyInsight: jest.fn() };
  const mockEngagement = { processBacklog: jest.fn() };
  const mockTrendMonitor = { getRelevantTrends: jest.fn() };
  const mockPublishing = {};
  const mockNotifications = { create: jest.fn() };

  beforeEach(async () => {
    prisma = {
      team: { findMany: jest.fn(), findUnique: jest.fn() },
      brandVoice: { findFirst: jest.fn() },
      post: { create: jest.fn(), update: jest.fn() },
      contentStrategy: { findFirst: jest.fn(), update: jest.fn() },
      agentRunLog: { findMany: jest.fn() },
      engagementAction: { count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgencyOrchestratorService,
        { provide: PrismaService, useValue: prisma },
        { provide: StrategistService, useValue: mockStrategist },
        { provide: CopywriterService, useValue: mockCopywriter },
        { provide: DesignerService, useValue: mockDesigner },
        { provide: AnalystService, useValue: mockAnalyst },
        { provide: EngagementManagerService, useValue: mockEngagement },
        { provide: TrendMonitorService, useValue: mockTrendMonitor },
        { provide: PublishingService, useValue: mockPublishing },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get(AgencyOrchestratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('runDailyCycleForTeam should execute full cycle', async () => {
    mockAnalyst.generateDailyInsight.mockResolvedValue({
      needsAdjustment: false,
      topPosts: [],
      underperformers: [],
      insights: [],
      recommendations: [],
    });

    mockStrategist.getCurrentStrategy.mockResolvedValue({
      id: 'strat_1',
      name: 'Q2 Strategy',
    });

    mockTrendMonitor.getRelevantTrends.mockResolvedValue([]);

    prisma.brandVoice.findFirst.mockResolvedValue({
      id: 'bv_1',
      name: 'TestBrand',
    });

    mockStrategist.getDailyBriefs.mockResolvedValue([
      {
        date: '2026-05-09',
        pillarTopic: 'Growth Tips',
        contentType: 'educational',
        platform: 'instagram',
        targetWordCount: 150,
        notes: '',
      },
    ]);

    mockCopywriter.generatePost.mockResolvedValue({
      content: 'Great growth tips post',
      hashtags: ['#growth'],
      imagePrompt: 'growth chart',
      style: 'graphic',
      aspectRatio: '1:1',
    });

    mockDesigner.generateImage.mockResolvedValue({
      url: 'https://example.com/image.png',
      prompt: 'growth chart',
    });

    prisma.post.create.mockResolvedValue({ id: 'post_1' });
    prisma.post.update.mockResolvedValue({ id: 'post_1', status: 'scheduled' });

    mockEngagement.processBacklog.mockResolvedValue({ processed: 0 });
    mockNotifications.create.mockResolvedValue({});

    const result = await service.runDailyCycleForTeam('team_1');

    expect(result.postsGenerated).toBe(1);
    expect(mockAnalyst.generateDailyInsight).toHaveBeenCalledWith('team_1');
    expect(mockCopywriter.generatePost).toHaveBeenCalledTimes(1);
    expect(mockDesigner.generateImage).toHaveBeenCalledTimes(1);
    expect(mockNotifications.create).toHaveBeenCalled();
  });

  it('should refine strategy when adjustments needed', async () => {
    mockAnalyst.generateDailyInsight.mockResolvedValue({
      needsAdjustment: true,
      topPosts: [],
      underperformers: [],
      insights: [],
      recommendations: [],
    });

    mockStrategist.getCurrentStrategy.mockResolvedValue({
      id: 'strat_1',
      name: 'Q2 Strategy',
    });
    mockStrategist.refineStrategy.mockResolvedValue({});
    mockTrendMonitor.getRelevantTrends.mockResolvedValue([]);
    prisma.brandVoice.findFirst.mockResolvedValue(null);
    mockEngagement.processBacklog.mockResolvedValue({ processed: 0 });
    mockNotifications.create.mockResolvedValue({});

    await service.runDailyCycleForTeam('team_1');

    expect(mockStrategist.refineStrategy).toHaveBeenCalledWith('strat_1');
  });

  it('getStatus should return orchestrator state', async () => {
    mockStrategist.getCurrentStrategy.mockResolvedValue({
      name: 'Test Strategy',
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    prisma.brandVoice.findFirst.mockResolvedValue({ name: 'TestBrand' });
    prisma.agentRunLog.findMany.mockResolvedValue([{}, {}, {}]);
    prisma.engagementAction.count.mockResolvedValue(5);

    const result = await service.getStatus('team_1');

    expect(result.hasActiveStrategy).toBe(true);
    expect(result.hasBrandVoice).toBe(true);
    expect(result.recentAgentRuns).toBe(3);
    expect(result.pendingEngagementActions).toBe(5);
  });
});
