import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { PublishingService } from '../publishing/publishing.service';

const user = {
  userId: 'user-1',
  email: 'user@example.com',
  team_id: 'team-1',
};

const mockPrisma = {
  teamMember: {
    findFirst: jest.fn(),
  },
  post: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  postPlatform: {
    createMany: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('PostsService', () => {
  let service: PostsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PostsService(mockPrisma as unknown as PrismaService);
  });

  describe('createPost', () => {
    it('creates a post with one platform', async () => {
      mockPrisma.teamMember.findFirst.mockResolvedValue({ teamId: 'team-1' });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.post.create.mockResolvedValue({ id: 'post-1' });
      mockPrisma.post.findUniqueOrThrow.mockResolvedValue({
        id: 'post-1',
        content: 'Hello world',
        status: 'draft',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        scheduledAt: null,
        platforms: [{ platform: 'twitter', status: 'draft' }],
      });

      const result = await service.createPost(user, {
        content: 'Hello world',
        platforms: ['twitter'],
      });

      expect(result.id).toBe('post-1');
      expect(result.platforms).toHaveLength(1);
      expect(mockPrisma.postPlatform.createMany).toHaveBeenCalledWith({
        data: [{ postId: 'post-1', platform: 'twitter', status: 'draft' }],
      });
    });

    it('creates a post with three platforms', async () => {
      mockPrisma.teamMember.findFirst.mockResolvedValue({ teamId: 'team-1' });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.post.create.mockResolvedValue({ id: 'post-2' });
      mockPrisma.post.findUniqueOrThrow.mockResolvedValue({
        id: 'post-2',
        content: 'Multi-platform',
        status: 'draft',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        scheduledAt: null,
        platforms: [
          { platform: 'twitter', status: 'draft' },
          { platform: 'instagram', status: 'draft' },
          { platform: 'linkedin', status: 'draft' },
        ],
      });

      const result = await service.createPost(user, {
        content: 'Multi-platform',
        platforms: ['twitter', 'instagram', 'linkedin'],
      });

      expect(result.platforms).toHaveLength(3);
    });

    it('creates scheduled posts with scheduled platform status', async () => {
      mockPrisma.teamMember.findFirst.mockResolvedValue({ teamId: 'team-1' });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.post.create.mockResolvedValue({ id: 'post-3' });
      mockPrisma.post.findUniqueOrThrow.mockResolvedValue({
        id: 'post-3',
        content: 'Scheduled',
        mediaUrls: ['https://example.com/image.jpg'],
        status: 'scheduled',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        scheduledAt: new Date('2026-01-02T00:00:00.000Z'),
        platforms: [{ platform: 'instagram', status: 'scheduled' }],
      });

      const result = await service.createPost(user, {
        content: 'Scheduled',
        platforms: ['instagram'],
        scheduledAt: '2026-01-02T00:00:00.000Z',
        mediaUrls: ['https://example.com/image.jpg'],
      });

      expect(result.status).toBe('scheduled');
      expect(result.mediaUrls).toEqual(['https://example.com/image.jpg']);
      expect(mockPrisma.post.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          mediaUrls: ['https://example.com/image.jpg'],
          status: 'scheduled',
        }),
      }));
      expect(mockPrisma.postPlatform.createMany).toHaveBeenCalledWith({
        data: [{ postId: 'post-3', platform: 'instagram', status: 'scheduled' }],
      });
    });

    it('starts publishing immediately when a scheduled post is already due', async () => {
      const publishPost = jest.fn().mockResolvedValue({ workflowId: 'wf-1' });
      const dueService = new PostsService(
        mockPrisma as unknown as PrismaService,
        { publishPost } as unknown as PublishingService,
      );
      mockPrisma.teamMember.findFirst.mockResolvedValue({ teamId: 'team-1' });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.post.create.mockResolvedValue({ id: 'post-4' });
      mockPrisma.post.findUniqueOrThrow.mockResolvedValue({
        id: 'post-4',
        content: 'Due now',
        mediaUrls: [],
        status: 'scheduled',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        scheduledAt: new Date('2020-01-01T00:00:00.000Z'),
        platforms: [{ platform: 'twitter', status: 'scheduled' }],
      });

      await dueService.createPost(user, {
        content: 'Due now',
        platforms: ['twitter'],
        scheduledAt: '2020-01-01T00:00:00.000Z',
      });

      expect(publishPost).toHaveBeenCalledWith('post-4', 'team-1');
    });

    it('throws 4xx error for invalid platform', async () => {
      await expect(
        service.createPost(user, {
          content: 'Hello world',
          platforms: ['youtube'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listPosts', () => {
    it('lists posts with pagination', async () => {
      mockPrisma.teamMember.findFirst.mockResolvedValue({ teamId: 'team-1' });
      mockPrisma.post.findMany.mockResolvedValue([
        {
          id: 'post-1',
          content: 'Post 1',
          status: 'draft',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          scheduledAt: null,
          platforms: [{ platform: 'twitter' }],
        },
      ]);

      const result = await service.listPosts(user, { page: 2, limit: 10 });

      expect(result.posts).toHaveLength(1);
      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teamId: 'team-1', deletedAt: null },
          skip: 10,
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('enforces team isolation', async () => {
      mockPrisma.teamMember.findFirst.mockResolvedValue({ teamId: 'team-2' });
      mockPrisma.post.findMany.mockResolvedValue([]);

      await service.listPosts(user, {});

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teamId: 'team-2', deletedAt: null },
        }),
      );
    });
  });

  describe('updatePost', () => {
    it('updates post content and status', async () => {
      mockPrisma.teamMember.findFirst.mockResolvedValue({ teamId: 'team-1' });
      mockPrisma.post.findFirst.mockResolvedValue({
        id: 'post-1',
        teamId: 'team-1',
        platforms: [{ platform: 'twitter' }],
      });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.post.update.mockResolvedValue({ id: 'post-1' });
      mockPrisma.post.findUniqueOrThrow.mockResolvedValue({
        id: 'post-1',
        content: 'Updated',
        status: 'scheduled',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        scheduledAt: new Date('2026-01-02T00:00:00.000Z'),
        platforms: [{ platform: 'twitter', status: 'scheduled' }],
      });

      const result = await service.updatePost(user, 'post-1', {
        content: 'Updated',
        status: 'scheduled',
      });

      expect(result.status).toBe('scheduled');
      expect(mockPrisma.postPlatform.updateMany).toHaveBeenCalledWith({
        where: { postId: 'post-1' },
        data: { status: 'scheduled' },
      });
    });

    it('throws 404 when post is not found', async () => {
      mockPrisma.teamMember.findFirst.mockResolvedValue({ teamId: 'team-1' });
      mockPrisma.post.findFirst.mockResolvedValue(null);

      await expect(service.updatePost(user, 'missing-post', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 403 when user tries to update another team post', async () => {
      mockPrisma.teamMember.findFirst.mockResolvedValue({ teamId: 'team-1' });
      mockPrisma.post.findFirst.mockResolvedValue({
        id: 'post-2',
        teamId: 'team-2',
        platforms: [{ platform: 'twitter' }],
      });

      await expect(
        service.updatePost(user, 'post-2', { content: 'Should fail' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('team membership', () => {
    it('throws 403 when user has no team membership', async () => {
      mockPrisma.teamMember.findFirst.mockResolvedValue(null);

      await expect(
        service.listPosts(user, { page: 1, limit: 20 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
