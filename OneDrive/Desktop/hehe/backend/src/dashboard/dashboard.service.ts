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

  async getInsights(teamId: string) {
    const engagement = await this.getEngagement(teamId, '30d');
    const recentLikes = engagement.series.likes.slice(-7).reduce((a, b) => a + b, 0);
    const prevLikes = engagement.series.likes.slice(-14, -7).reduce((a, b) => a + b, 0);
    const trend = prevLikes === 0 ? 0 : ((recentLikes - prevLikes) / prevLikes) * 100;

    const insights: Array<{ id: string; type: 'opportunity' | 'warning' | 'tip'; title: string; body: string; cta: string; href: string }> = [];

    if (trend > 10) {
      insights.push({
        id: 'trend-up',
        type: 'opportunity',
        title: 'Engagement up ' + trend.toFixed(0) + '% this week',
        body: 'Your last 7 days outperformed the prior week. Double down on what worked.',
        cta: 'See top posts',
        href: '/analytics',
      });
    } else if (trend < -10) {
      insights.push({
        id: 'trend-down',
        type: 'warning',
        title: 'Engagement down ' + Math.abs(trend).toFixed(0) + '% this week',
        body: 'Posting cadence or content mix may need tuning.',
        cta: 'Run diagnosis',
        href: '/analytics/insights',
      });
    }

    const upcoming = await this.prisma.post.count({
      where: { teamId, status: 'scheduled' },
    });
    if (upcoming < 3) {
      insights.push({
        id: 'queue-low',
        type: 'tip',
        title: 'Only ' + upcoming + ' post' + (upcoming === 1 ? '' : 's') + ' scheduled',
        body: 'Fill your week — generate 5 posts with AI in one click.',
        cta: 'Generate week',
        href: '/agency/strategy',
      });
    }

    return { insights };
  }

  async getActivity(teamId: string, limit = 10) {
    const items = await this.prisma.agentActivity.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return items.map((i) => ({
      id: i.id,
      agent: i.agent,
      action: i.action,
      at: i.createdAt.toISOString(),
    }));
  }
}
