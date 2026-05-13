import { PublishingService } from './publishing.service';
import { TemporalClientService } from '../temporal/client';
import { PrismaService } from '../prisma/prisma.service';
import { createPublishingActivities } from './activities';
import { createAnalyticsActivities } from '../analytics/activities';
import { PlatformsService } from '../platforms/platforms.service';
import { PublishingSchedulerService } from './scheduler.service';

const mockPrisma = {
  post: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  postPlatform: {
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  postPublishLog: {
    create: jest.fn(),
  },
  analyticsEvent: {
    createMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockTemporalClient = {
  getClient: jest.fn(),
};

const mockPlatformsService = {
  getCredential: jest.fn(),
} as unknown as PlatformsService;

describe('PublishingService', () => {
  let service: PublishingService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.post.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.postPlatform.updateMany.mockResolvedValue({ count: 1 });
    service = new PublishingService(
      mockPrisma as unknown as PrismaService,
      mockTemporalClient as unknown as TemporalClientService,
    );
  });

  it('publishes to single platform with correct workflow params', async () => {
    const start = jest.fn().mockResolvedValue({ workflowId: 'publish-1' });
    mockTemporalClient.getClient.mockResolvedValue({ workflow: { start } });

    const result = await service.startPublishPostWorkflow('post-1', 'team-1');

    expect(start).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
      args: [{ postId: 'post-1', teamId: 'team-1', taskQueue: 'posts-queue' }],
      taskQueue: 'posts-queue',
    }));
    expect(result.workflowId).toBe('publish-1');
  });

  it('publishes to 3 scheduled posts', async () => {
    const start = jest.fn()
      .mockResolvedValueOnce({ workflowId: 'wf-1' })
      .mockResolvedValueOnce({ workflowId: 'wf-2' })
      .mockResolvedValueOnce({ workflowId: 'wf-3' });
    mockTemporalClient.getClient.mockResolvedValue({ workflow: { start } });
    mockPrisma.post.findMany.mockResolvedValue([
      { id: 'p1', teamId: 't1' },
      { id: 'p2', teamId: 't1' },
      { id: 'p3', teamId: 't1' },
    ]);

    const workflowIds = await service.publishDuePosts();

    expect(workflowIds).toEqual(['wf-1', 'wf-2', 'wf-3']);
    expect(start).toHaveBeenCalledTimes(3);
    expect(mockPrisma.post.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'publishing' },
    }));
  });

  it('does not start a duplicate workflow when a due post was already claimed', async () => {
    const start = jest.fn();
    mockTemporalClient.getClient.mockResolvedValue({ workflow: { start } });
    mockPrisma.post.findMany.mockResolvedValue([{ id: 'p1', teamId: 't1' }]);
    mockPrisma.post.updateMany.mockResolvedValue({ count: 0 });

    const workflowIds = await service.publishDuePosts();

    expect(workflowIds).toEqual([]);
    expect(start).not.toHaveBeenCalled();
  });

  it('scheduler finds due posts and starts workflows', async () => {
    const scheduler = new PublishingSchedulerService(service);
    const spy = jest.spyOn(service, 'publishDuePosts').mockResolvedValue(['wf-1']);

    const result = await scheduler.checkAndPublish();

    expect(spy).toHaveBeenCalled();
    expect(result).toEqual(['wf-1']);
  });

  it('marks partially published when 2 of 4 fail', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
      fn(mockPrisma),
    );
    const activities = createPublishingActivities(
      mockPrisma as unknown as PrismaService,
      mockPlatformsService,
    );

    await activities.finalizePublishPost({
      postId: 'post-1',
      teamId: 'team-1',
      results: [
        { postPlatformId: 'pp-1', platform: 'twitter', success: true },
        { postPlatformId: 'pp-2', platform: 'instagram', success: true },
        { postPlatformId: 'pp-3', platform: 'linkedin', success: false, error: 'boom' },
        { postPlatformId: 'pp-4', platform: 'facebook', success: false, error: 'boom' },
      ],
    });

    expect(mockPrisma.post.update).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: { status: 'partially_published' },
    });
  });

  it('stores analytics metrics in DB', async () => {
    const analyticsActivities = createAnalyticsActivities(
      mockPrisma as unknown as PrismaService,
      mockPlatformsService,
    );

    await analyticsActivities.persistAnalyticsMetrics({
      postId: 'post-1',
      metrics: [{
        platform: 'twitter',
        externalId: 'x1',
        impressions: 1000,
        engagements: 100,
        likes: 80,
        comments: 20,
      }],
    });

    expect(mockPrisma.analyticsEvent.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ eventType: 'twitter:impressions', count: 1000 }),
          expect.objectContaining({ eventType: 'twitter:engagements', count: 100 }),
        ]),
      }),
    );
  });
});
