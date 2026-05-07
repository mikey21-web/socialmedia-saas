import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsExportService {
  constructor(private readonly prisma: PrismaService) {}

  async export(
    teamId: string,
    type: 'posts' | 'trends',
    startDate?: string,
    endDate?: string,
  ): Promise<{ csv: string; filename: string }> {
    const { from, to } = this.resolveDateRange(startDate, endDate);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${type}-export-${dateStr}.csv`;

    if (type === 'posts') {
      const csv = await this.exportPostsCsv(teamId, from, to);
      return { csv, filename };
    } else {
      const csv = await this.exportTrendsCsv(teamId, from, to);
      return { csv, filename };
    }
  }

  async exportPostsCsv(teamId: string, startDate?: Date, endDate?: Date): Promise<string> {
    const dateRange = this.buildDateRangeClause(startDate, endDate);

    const posts = await this.prisma.post.findMany({
      where: {
        teamId,
        deletedAt: null,
        ...dateRange,
      },
      select: {
        id: true,
        title: true,
        platforms: {
          select: {
            platform: true,
          },
        },
        scheduledAt: true,
        createdAt: true,
        generationContext: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const postMetrics = new Map<string, { likes: number; comments: number; shares: number }>();

    for (const post of posts) {
      const metrics = await this.aggregatePostMetrics(post.id, startDate, endDate);
      postMetrics.set(post.id, metrics);
    }

    return this.buildPostsCsv(posts, postMetrics);
  }

  async exportTrendsCsv(teamId: string, startDate?: Date, endDate?: Date): Promise<string> {
    const dateRange = this.buildDateRangeClause(startDate, endDate);

    const trends = await this.prisma.trendItem.findMany({
      where: {
        teamId,
        ...dateRange,
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.buildTrendsCsv(trends);
  }

  private buildPostsCsv(posts: any[], metrics: Map<string, any>): string {
    const header = 'post_id,title,platform,published_at,likes,comments,shares,relevanceScore';
    const rows = posts.map((post) => {
      const postMetrics = metrics.get(post.id) || { likes: 0, comments: 0, shares: 0 };
      const platform = post.platforms.map((p: any) => p.platform).join('+');
      const publishedAt = post.scheduledAt || post.createdAt;
      const relevanceScore = post.generationContext?.relevanceScore ?? 0;

      return [
        this.escapeCsvField(post.id),
        this.escapeCsvField(post.title),
        this.escapeCsvField(platform),
        this.escapeCsvField(publishedAt?.toISOString() || ''),
        this.escapeCsvField(String(postMetrics.likes)),
        this.escapeCsvField(String(postMetrics.comments)),
        this.escapeCsvField(String(postMetrics.shares)),
        this.escapeCsvField(String(relevanceScore)),
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  private buildTrendsCsv(trends: any[]): string {
    const header = 'trend_id,title,source,relevanceScore,brandFitReason,detectedAt,status';
    const rows = trends.map((trend) => [
      this.escapeCsvField(trend.id),
      this.escapeCsvField(trend.title),
      this.escapeCsvField(trend.source),
      this.escapeCsvField(String(trend.relevanceScore ?? 0)),
      this.escapeCsvField(trend.brandFitReason),
      this.escapeCsvField(trend.detectedAt?.toISOString() || ''),
      this.escapeCsvField(trend.status),
    ].join(','));

    return [header, ...rows].join('\n');
  }

  private escapeCsvField(value: string | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private resolveDateRange(from?: string, to?: string): { from: Date; to: Date } {
    const end = to ? new Date(to) : new Date();
    const start = from ? new Date(from) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: start, to: end };
  }

  private buildDateRangeClause(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) return {};
    return {
      OR: [
        {
          scheduledAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
        {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
      ],
    };
  }

  async aggregatePostMetrics(
    postId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ likes: number; comments: number; shares: number }> {
    const whereClause: any = { postId };

    if (startDate || endDate) {
      whereClause.collectedAt = {};
      if (startDate) whereClause.collectedAt.gte = startDate;
      if (endDate) whereClause.collectedAt.lte = endDate;
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where: whereClause,
      select: {
        eventType: true,
        count: true,
      },
    });

    let likes = 0;
    let comments = 0;
    let shares = 0;

    for (const event of events) {
      const metric = event.eventType.split(':')[1] || event.eventType;
      if (metric === 'like' || metric === 'likes') {
        likes += event.count;
      } else if (metric === 'comment' || metric === 'comments') {
        comments += event.count;
      } else if (metric === 'share' || metric === 'shares') {
        shares += event.count;
      }
    }

    return { likes, comments, shares };
  }
}