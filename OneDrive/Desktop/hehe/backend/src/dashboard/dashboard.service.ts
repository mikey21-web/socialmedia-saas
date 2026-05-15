import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(teamId: string) {
    const [postsTotal, postsPublished, postsScheduled, platformsConnected] = await Promise.all([
      this.prisma.post.count({ where: { teamId } }),
      this.prisma.post.count({ where: { teamId, status: 'published' } }),
      this.prisma.post.count({ where: { teamId, status: 'scheduled' } }),
      this.prisma.platformCredential.count({ where: { teamId } }),
    ]);
    await this.prisma.post.findMany({ where: { teamId }, take: 0 });
    return {
      postsTotal,
      postsPublished,
      postsScheduled,
      platformsConnected,
      sparklines: { followers: [], engagement: [], reach: [] },
    };
  }
}
