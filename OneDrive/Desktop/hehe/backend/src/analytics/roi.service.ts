import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateUtmLinkDto {
  postId?: string;
  platform: string;
  destinationUrl: string;
  utmCampaign?: string;
  utmContent?: string;
}

export interface RecordConversionDto {
  utmLinkId?: string;
  postId?: string;
  eventType: 'click' | 'signup' | 'purchase' | 'booking' | 'lead';
  value?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  sourceIp?: string;
  userAgent?: string;
}

export interface RoiSummary {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
  revenuePerPost: number;
  topPerformingPosts: Array<{
    postId: string;
    title: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  byPlatform: Array<{
    platform: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
}

@Injectable()
export class RoiService {
  private readonly logger = new Logger(RoiService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createUtmLink(teamId: string, dto: CreateUtmLinkDto) {
    const shortCode = this.generateShortCode();
    const utmSource = dto.platform;
    const baseUrl = process.env.BACKEND_URL ?? 'http://localhost:3001';

    const link = await this.prisma.utmLink.create({
      data: {
        teamId,
        postId: dto.postId,
        platform: dto.platform,
        destinationUrl: dto.destinationUrl,
        utmSource,
        utmMedium: 'social',
        utmCampaign: dto.utmCampaign,
        utmContent: dto.utmContent,
        shortUrl: `${baseUrl}/r/${shortCode}`,
      },
    });

    return {
      id: link.id,
      shortUrl: link.shortUrl,
      fullUrl: this.buildFullUtmUrl(dto.destinationUrl, {
        utm_source: utmSource,
        utm_medium: 'social',
        utm_campaign: dto.utmCampaign,
        utm_content: dto.utmContent,
      }),
    };
  }

  async createUtmLinksForPost(teamId: string, postId: string, destinationUrl: string, platforms: string[]) {
    const links = [];
    for (const platform of platforms) {
      const link = await this.createUtmLink(teamId, {
        postId,
        platform,
        destinationUrl,
        utmCampaign: `post_${postId.slice(0, 8)}`,
        utmContent: platform,
      });
      links.push(link);
    }
    return links;
  }

  async recordClick(shortCode: string, sourceIp?: string, userAgent?: string) {
    const baseUrl = process.env.BACKEND_URL ?? 'http://localhost:3001';
    const shortUrl = `${baseUrl}/r/${shortCode}`;

    const link = await this.prisma.utmLink.findFirst({
      where: { shortUrl },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.prisma.utmLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    });

    await this.prisma.conversionEvent.create({
      data: {
        teamId: link.teamId,
        utmLinkId: link.id,
        postId: link.postId,
        eventType: 'click',
        sourceIp,
        userAgent,
      },
    });

    return {
      redirectUrl: this.buildFullUtmUrl(link.destinationUrl, {
        utm_source: link.utmSource,
        utm_medium: link.utmMedium,
        utm_campaign: link.utmCampaign ?? undefined,
        utm_content: link.utmContent ?? undefined,
      }),
    };
  }

  async recordConversion(teamId: string, dto: RecordConversionDto) {
    const event = await this.prisma.conversionEvent.create({
      data: {
        teamId,
        utmLinkId: dto.utmLinkId,
        postId: dto.postId,
        eventType: dto.eventType,
        value: dto.value ?? 0,
        currency: dto.currency ?? 'INR',
        metadata: (dto.metadata ?? {}) as any,
        sourceIp: dto.sourceIp,
        userAgent: dto.userAgent,
      },
    });

    // Update UTM link conversion count and revenue
    if (dto.utmLinkId && dto.eventType !== 'click') {
      await this.prisma.utmLink.update({
        where: { id: dto.utmLinkId },
        data: {
          conversions: { increment: 1 },
          revenue: { increment: dto.value ?? 0 },
        },
      });
    }

    return event;
  }

  async getRoiSummary(teamId: string, from?: Date, to?: Date): Promise<RoiSummary> {
    const dateFilter = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };

    const links = await this.prisma.utmLink.findMany({
      where: {
        teamId,
        ...(from || to ? { createdAt: dateFilter } : {}),
      },
    });

    const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
    const totalConversions = links.reduce((sum, l) => sum + l.conversions, 0);
    const totalRevenue = links.reduce((sum, l) => sum + l.revenue, 0);
    const postsWithLinks = new Set(links.filter(l => l.postId).map(l => l.postId)).size;

    // Group by post
    const postMap = new Map<string, { clicks: number; conversions: number; revenue: number }>();
    for (const link of links) {
      if (!link.postId) continue;
      const entry = postMap.get(link.postId) ?? { clicks: 0, conversions: 0, revenue: 0 };
      entry.clicks += link.clicks;
      entry.conversions += link.conversions;
      entry.revenue += link.revenue;
      postMap.set(link.postId, entry);
    }

    const topPostIds = [...postMap.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue || b[1].conversions - a[1].conversions)
      .slice(0, 10)
      .map(([id]) => id);

    const posts = topPostIds.length
      ? await this.prisma.post.findMany({
          where: { id: { in: topPostIds } },
          select: { id: true, title: true },
        })
      : [];

    const topPerformingPosts = topPostIds.map(postId => {
      const post = posts.find(p => p.id === postId);
      const data = postMap.get(postId)!;
      return {
        postId,
        title: post?.title ?? 'Untitled',
        ...data,
      };
    });

    // Group by platform
    const platformMap = new Map<string, { clicks: number; conversions: number; revenue: number }>();
    for (const link of links) {
      const entry = platformMap.get(link.platform) ?? { clicks: 0, conversions: 0, revenue: 0 };
      entry.clicks += link.clicks;
      entry.conversions += link.conversions;
      entry.revenue += link.revenue;
      platformMap.set(link.platform, entry);
    }

    return {
      totalClicks,
      totalConversions,
      totalRevenue,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      revenuePerPost: postsWithLinks > 0 ? totalRevenue / postsWithLinks : 0,
      topPerformingPosts,
      byPlatform: [...platformMap.entries()].map(([platform, data]) => ({ platform, ...data })),
    };
  }

  async getPostRoi(teamId: string, postId: string) {
    const links = await this.prisma.utmLink.findMany({
      where: { teamId, postId },
    });

    const events = await this.prisma.conversionEvent.findMany({
      where: { teamId, postId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      links: links.map(l => ({
        id: l.id,
        platform: l.platform,
        shortUrl: l.shortUrl,
        clicks: l.clicks,
        conversions: l.conversions,
        revenue: l.revenue,
      })),
      totalClicks: links.reduce((s, l) => s + l.clicks, 0),
      totalConversions: links.reduce((s, l) => s + l.conversions, 0),
      totalRevenue: links.reduce((s, l) => s + l.revenue, 0),
      recentEvents: events.map(e => ({
        type: e.eventType,
        value: e.value,
        createdAt: e.createdAt,
      })),
    };
  }

  private generateShortCode(): string {
    return randomBytes(4).toString('base64url');
  }

  private buildFullUtmUrl(
    baseUrl: string,
    params: Record<string, string | undefined>,
  ): string {
    const url = new URL(baseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }
}
