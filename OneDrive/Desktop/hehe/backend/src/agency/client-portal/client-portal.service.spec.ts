import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClientPortalService } from './client-portal.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  team: { create: jest.fn() },
  clientPortal: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  bulkOnboardJob: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  post: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  analyticsEvent: {
    findMany: jest.fn(),
  },
};

describe('ClientPortalService', () => {
  let service: ClientPortalService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = 'http://localhost:3000';
    service = new ClientPortalService(mockPrisma as unknown as PrismaService);
  });

  describe('createClientPortal', () => {
    it('creates a client team and portal with access token', async () => {
      mockPrisma.team.create.mockResolvedValue({ id: 'client-team-1' });
      mockPrisma.clientPortal.create.mockResolvedValue({
        id: 'portal-1',
        accessToken: 'token-abc',
      });

      const result = await service.createClientPortal('agency-1', {
        clientName: 'Acme Corp',
        clientEmail: 'client@acme.com',
      });

      expect(result.clientTeamId).toBe('client-team-1');
      expect(result.previewLink).toContain('portal/');
      expect(mockPrisma.team.create).toHaveBeenCalled();
    });
  });

  describe('getClientView', () => {
    it('throws when token is invalid', async () => {
      mockPrisma.clientPortal.findUnique.mockResolvedValue(null);
      await expect(service.getClientView('bad-token')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when portal is inactive', async () => {
      mockPrisma.clientPortal.findUnique.mockResolvedValue({
        id: 'p1',
        isActive: false,
      });
      await expect(service.getClientView('token')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns client view with allowed permissions', async () => {
      mockPrisma.clientPortal.findUnique.mockResolvedValue({
        id: 'p1',
        clientTeamId: 'team1',
        clientName: 'Acme',
        brandColor: '#fff',
        isActive: true,
        permissions: { viewPosts: true, approvePosts: true, viewAnalytics: false },
      });
      mockPrisma.clientPortal.update.mockResolvedValue({});
      mockPrisma.post.findMany.mockResolvedValue([
        { id: 'p1', title: 'Test', content: 'hi', status: 'draft' },
      ]);

      const view = await service.getClientView('token');
      expect(view.posts).toHaveLength(1);
      expect(view.analytics).toBeUndefined();
    });
  });

  describe('clientApprovePost', () => {
    it('throws when permission not granted', async () => {
      mockPrisma.clientPortal.findUnique.mockResolvedValue({
        isActive: true,
        permissions: { approvePosts: false },
      });

      await expect(service.clientApprovePost('token', 'post1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('updates post status to approved', async () => {
      mockPrisma.clientPortal.findUnique.mockResolvedValue({
        isActive: true,
        clientTeamId: 'team1',
        permissions: { approvePosts: true },
      });
      mockPrisma.post.findFirst.mockResolvedValue({ id: 'post1' });
      mockPrisma.post.update.mockResolvedValue({ id: 'post1', status: 'approved' });

      await service.clientApprovePost('token', 'post1');

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post1' },
        data: { status: 'approved' },
      });
    });
  });

  describe('bulkOnboard', () => {
    it('rejects empty arrays', async () => {
      await expect(service.bulkOnboard('agency1', [])).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects more than 50 clients', async () => {
      const clients = Array.from({ length: 51 }, (_, i) => ({
        clientName: `client-${i}`,
        websiteUrl: `https://${i}.com`,
      }));
      await expect(service.bulkOnboard('agency1', clients)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a job and returns jobId', async () => {
      mockPrisma.bulkOnboardJob.create.mockResolvedValue({ id: 'job-1' });
      mockPrisma.team.create.mockResolvedValue({ id: 'team-1' });
      mockPrisma.clientPortal.create.mockResolvedValue({ id: 'p1', accessToken: 't' });
      mockPrisma.bulkOnboardJob.update.mockResolvedValue({});

      const result = await service.bulkOnboard('agency1', [
        { clientName: 'A', websiteUrl: 'https://a.com' },
      ]);

      expect(result.jobId).toBe('job-1');
      expect(result.totalClients).toBe(1);
    });
  });
});
