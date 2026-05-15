import { Test } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: { post: { count: jest.Mock; findMany: jest.Mock }, platformCredential: { count: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      post: { count: jest.fn(), findMany: jest.fn() },
      platformCredential: { count: jest.fn() },
    };
    const mod = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = mod.get(DashboardService);
  });

  it('getSummary returns posts counts + connected platforms count', async () => {
    prisma.post.count.mockResolvedValueOnce(42); // total
    prisma.post.count.mockResolvedValueOnce(28); // published
    prisma.post.count.mockResolvedValueOnce(11); // scheduled
    prisma.platformCredential.count.mockResolvedValueOnce(3);
    prisma.post.findMany.mockResolvedValue([]);

    const result = await service.getSummary('team-1');
    expect(result).toEqual({
      postsTotal: 42,
      postsPublished: 28,
      postsScheduled: 11,
      platformsConnected: 3,
      sparklines: { followers: [], engagement: [], reach: [] },
    });
  });
});
