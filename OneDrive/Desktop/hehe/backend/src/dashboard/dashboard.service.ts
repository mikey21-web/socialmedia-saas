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
    return {
      postsTotal,
      postsPublished,
      postsScheduled,
      platformsConnected,
      sparklines: { followers: [], engagement: [], reach: [] },
    };
  }

  async getEngagement(teamId: string, range: '7d' | '30d' | '90d') {
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const start = new Date();
    start.setDate(start.getDate() - days);

    // PlatformMetrics links to posts; filter by team through the post relation
    const metrics = await this.prisma.platformMetrics.findMany({
      where: {
        collectedAt: { gte: start },
        post: { teamId },
      },
      orderBy: { collectedAt: 'asc' },
    });

    const dayKeys: string[] = [];
    const likes: number[] = [];
    const comments: number[] = [];
    const reach: number[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i + 1);
      const key = d.toISOString().slice(0, 10);
      dayKeys.push(key);
      const dayMetrics = metrics.filter((m) => m.collectedAt.toISOString().slice(0, 10) === key);
      likes.push(dayMetrics.reduce((s, m) => s + (m.likes ?? 0), 0));
      comments.push(dayMetrics.reduce((s, m) => s + (m.comments ?? 0), 0));
      reach.push(dayMetrics.reduce((s, m) => s + (m.reach ?? 0), 0));
    }

    return { days: dayKeys, series: { likes, comments, reach } };
  }
}
