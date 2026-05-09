import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CampaignDto = {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  createCampaign(teamId: string, dto: CampaignDto) {
    return this.prisma.campaign.create({
      data: {
        teamId,
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async listCampaigns(teamId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { teamId, deletedAt: null },
      include: {
        posts: {
          where: { deletedAt: null },
          select: {
            id: true,
            analytics: { select: { eventType: true, count: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map((campaign) => {
      const totals = campaign.posts.reduce(
        (acc, post) => {
          for (const event of post.analytics) {
            const metric = this.normalizeMetric(event.eventType.split(':')[1] || event.eventType);
            if (metric === 'impressions') acc.totalImpressions += event.count;
            if (metric === 'engagements' || metric === 'likes' || metric === 'comments' || metric === 'shares' || metric === 'saves') {
              acc.totalEngagements += event.count;
            }
          }
          return acc;
        },
        { totalImpressions: 0, totalEngagements: 0 },
      );

      return {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        postCount: campaign.posts.length,
        totalImpressions: totals.totalImpressions,
        totalEngagements: totals.totalEngagements,
        engagementRate: totals.totalImpressions > 0
          ? (totals.totalEngagements / totals.totalImpressions) * 100
          : 0,
      };
    });
  }

  async getCampaignStats(campaignId: string, teamId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, teamId: true, deletedAt: true },
    });

    if (!campaign || campaign.deletedAt) {
      throw new NotFoundException('Campaign not found');
    }
    if (campaign.teamId !== teamId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    const posts = await this.prisma.post.findMany({
      where: { teamId, campaignId, deletedAt: null },
      select: {
        id: true,
        title: true,
        platforms: { select: { platform: true } },
        analytics: {
          select: {
            count: true,
            eventType: true,
            collectedAt: true,
          },
        },
      },
    });

    const byPlatformMap = new Map<string, {
      platform: string;
      impressions: number;
      reach: number;
      likes: number;
      comments: number;
      shares: number;
      saves: number;
      engagements: number;
    }>();
    const byDayMap = new Map<string, { date: string; impressions: number; engagements: number }>();
    const byDayPlatformMap = new Map<string, Record<string, number | string>>();
    const topPostsMap = new Map<string, {
      postId: string;
      title: string;
      platform: string;
      impressions: number;
      engagements: number;
    }>();

    for (const post of posts) {
      const fallbackPlatform = post.platforms[0]?.platform ?? 'unknown';
      const topEntry = topPostsMap.get(post.id) ?? {
        postId: post.id,
        title: post.title,
        platform: fallbackPlatform,
        impressions: 0,
        engagements: 0,
      };

      for (const event of post.analytics) {
        const parsed = this.parseEventType(event.eventType, fallbackPlatform);
        const metric = this.normalizeMetric(parsed.metric);
        if (!metric) continue;

        const platformEntry = byPlatformMap.get(parsed.platform) ?? {
          platform: parsed.platform,
          impressions: 0,
          reach: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          engagements: 0,
        };

        if (metric === 'impressions') {
          platformEntry.impressions += event.count;
          topEntry.impressions += event.count;
        }
        if (metric === 'reach') platformEntry.reach += event.count;
        if (metric === 'likes') platformEntry.likes += event.count;
        if (metric === 'comments') platformEntry.comments += event.count;
        if (metric === 'shares') platformEntry.shares += event.count;
        if (metric === 'saves') platformEntry.saves += event.count;
        if (metric === 'engagements' || metric === 'likes' || metric === 'comments' || metric === 'shares' || metric === 'saves') {
          platformEntry.engagements += event.count;
          topEntry.engagements += event.count;
        }
        byPlatformMap.set(parsed.platform, platformEntry);

        const date = event.collectedAt.toISOString().slice(0, 10);
        const dayEntry = byDayMap.get(date) ?? { date, impressions: 0, engagements: 0 };
        if (metric === 'impressions') dayEntry.impressions += event.count;
        if (metric === 'engagements' || metric === 'likes' || metric === 'comments' || metric === 'shares' || metric === 'saves') {
          dayEntry.engagements += event.count;
        }
        byDayMap.set(date, dayEntry);

        const dailyPlatformEntry = byDayPlatformMap.get(date) ?? { date };
        if (metric === 'impressions') {
          const currentValue = typeof dailyPlatformEntry[parsed.platform] === 'number'
            ? Number(dailyPlatformEntry[parsed.platform])
            : 0;
          dailyPlatformEntry[parsed.platform] = currentValue + event.count;
        }
        byDayPlatformMap.set(date, dailyPlatformEntry);
      }

      topPostsMap.set(post.id, topEntry);
    }

    const byPlatform = Array.from(byPlatformMap.values()).sort((a, b) => a.platform.localeCompare(b.platform));
    return {
      totalImpressions: byPlatform.reduce((sum, item) => sum + item.impressions, 0),
      totalEngagements: byPlatform.reduce((sum, item) => sum + item.engagements, 0),
      totalReach: byPlatform.reduce((sum, item) => sum + item.reach, 0),
      totalSaves: byPlatform.reduce((sum, item) => sum + item.saves, 0),
      byPlatform: byPlatform.map(({ reach: _reach, engagements: _engagements, ...item }) => item),
      byDay: Array.from(byDayMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      byDayPlatform: Array.from(byDayPlatformMap.values()).sort((a, b) =>
        String(a.date).localeCompare(String(b.date)),
      ),
      topPosts: Array.from(topPostsMap.values())
        .sort((a, b) => b.engagements - a.engagements || b.impressions - a.impressions)
        .slice(0, 10),
    };
  }

  async assignPostToCampaign(postId: string, campaignId: string, teamId: string) {
    const [campaign, post] = await Promise.all([
      this.prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { id: true, teamId: true, deletedAt: true },
      }),
      this.prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, teamId: true, deletedAt: true },
      }),
    ]);

    if (!campaign || campaign.deletedAt) {
      throw new NotFoundException('Campaign not found');
    }
    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found');
    }
    if (campaign.teamId !== teamId || post.teamId !== teamId) {
      throw new ForbiddenException('You do not have access to this campaign or post');
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: { campaignId },
    });
  }

  private parseEventType(eventType: string, fallbackPlatform: string) {
    const [first, second] = eventType.split(':');
    if (!second) {
      return { platform: fallbackPlatform, metric: first };
    }
    return { platform: first, metric: second };
  }

  private normalizeMetric(metric: string) {
    const normalized = metric.toLowerCase();
    if (normalized === 'impression' || normalized === 'impressions' || normalized === 'view' || normalized === 'views') {
      return 'impressions';
    }
    if (normalized === 'reach') return 'reach';
    if (normalized === 'like' || normalized === 'likes') return 'likes';
    if (normalized === 'comment' || normalized === 'comments' || normalized === 'reply' || normalized === 'replies') {
      return 'comments';
    }
    if (normalized === 'share' || normalized === 'shares' || normalized === 'retweet' || normalized === 'retweets') {
      return 'shares';
    }
    if (normalized === 'save' || normalized === 'saves') return 'saves';
    if (normalized === 'engagement' || normalized === 'engagements') return 'engagements';
    return null;
  }
}
