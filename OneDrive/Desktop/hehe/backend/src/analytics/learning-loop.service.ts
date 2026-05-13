import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

export interface InsightSummary {
  insightType: string;
  pattern: string;
  multiplier: number;
  confidence: number;
  description: string;
}

@Injectable()
export class LearningLoopService {
  private readonly logger = new Logger(LearningLoopService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Run weekly at midnight Sunday — analyze last 30 days of posts
   * and extract performance patterns per team.
   */
  @Cron('0 0 * * 0')
  async weeklyPatternAnalysis() {
    this.logger.log('Starting weekly performance pattern analysis');
    const teams = await this.prisma.team.findMany({
      where: { onboardingComplete: true, deletedAt: null },
      select: { id: true },
    });

    for (const team of teams) {
      try {
        await this.analyzeTeamPatterns(team.id);
      } catch (err) {
        this.logger.error(`Pattern analysis failed for team ${team.id}`, err);
      }
    }
  }

  async analyzeTeamPatterns(teamId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const posts = await this.prisma.post.findMany({
      where: {
        teamId,
        status: 'published',
        deletedAt: null,
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        analytics: { select: { eventType: true, count: true } },
        platforms: { select: { platform: true } },
      },
    });

    if (posts.length < 10) {
      return { message: 'Not enough data (need 10+ published posts)' };
    }

    // Calculate engagement per post
    const postEngagements = posts.map(post => {
      const engagement = post.analytics.reduce((sum, e) => {
        if (e.eventType.includes('like') || e.eventType.includes('comment') ||
            e.eventType.includes('share') || e.eventType.includes('engagement')) {
          return sum + e.count;
        }
        return sum;
      }, 0);

      return {
        id: post.id,
        content: post.content,
        hookType: this.detectHookType(post.content),
        contentFormat: this.detectContentFormat(post.content, post.mediaUrls as string[]),
        postingHour: post.scheduledAt ? new Date(post.scheduledAt).getHours() : null,
        postingDay: post.scheduledAt ? new Date(post.scheduledAt).getDay() : null,
        platform: post.platforms[0]?.platform ?? 'unknown',
        engagement,
        hasEmoji: /[\u{1F600}-\u{1F64F}]/u.test(post.content),
        hasCta: /\b(link in bio|comment|share|save|dm|click|book|buy|sign up)\b/i.test(post.content),
        hashtagCount: (post.content.match(/#\w+/g) ?? []).length,
        wordCount: post.content.split(/\s+/).length,
      };
    });

    const avgEngagement = postEngagements.reduce((s, p) => s + p.engagement, 0) / postEngagements.length;
    const insights: Array<{ insightType: string; pattern: string; multiplier: number; sampleSize: number; metadata: Record<string, unknown> }> = [];

    // Analyze hook types
    const hookGroups = this.groupBy(postEngagements, 'hookType');
    for (const [hookType, group] of Object.entries(hookGroups)) {
      if (group.length < 3) continue;
      const groupAvg = group.reduce((s, p) => s + p.engagement, 0) / group.length;
      const multiplier = avgEngagement > 0 ? groupAvg / avgEngagement : 1;
      if (Math.abs(multiplier - 1) > 0.2) {
        insights.push({
          insightType: 'hook_type',
          pattern: hookType,
          multiplier,
          sampleSize: group.length,
          metadata: { avgEngagement: groupAvg },
        });
      }
    }

    // Analyze posting times
    const hourGroups = this.groupBy(
      postEngagements.filter(p => p.postingHour !== null),
      'postingHour',
    );
    for (const [hour, group] of Object.entries(hourGroups)) {
      if (group.length < 3) continue;
      const groupAvg = group.reduce((s, p) => s + p.engagement, 0) / group.length;
      const multiplier = avgEngagement > 0 ? groupAvg / avgEngagement : 1;
      if (multiplier > 1.3) {
        insights.push({
          insightType: 'posting_time',
          pattern: `hour_${hour}`,
          multiplier,
          sampleSize: group.length,
          metadata: { hour: Number(hour), avgEngagement: groupAvg },
        });
      }
    }

    // Analyze content format
    const formatGroups = this.groupBy(postEngagements, 'contentFormat');
    for (const [format, group] of Object.entries(formatGroups)) {
      if (group.length < 3) continue;
      const groupAvg = group.reduce((s, p) => s + p.engagement, 0) / group.length;
      const multiplier = avgEngagement > 0 ? groupAvg / avgEngagement : 1;
      if (Math.abs(multiplier - 1) > 0.2) {
        insights.push({
          insightType: 'content_format',
          pattern: format,
          multiplier,
          sampleSize: group.length,
          metadata: { avgEngagement: groupAvg },
        });
      }
    }

    // Analyze CTA presence
    const withCta = postEngagements.filter(p => p.hasCta);
    const withoutCta = postEngagements.filter(p => !p.hasCta);
    if (withCta.length >= 3 && withoutCta.length >= 3) {
      const ctaAvg = withCta.reduce((s, p) => s + p.engagement, 0) / withCta.length;
      const noCtaAvg = withoutCta.reduce((s, p) => s + p.engagement, 0) / withoutCta.length;
      const multiplier = noCtaAvg > 0 ? ctaAvg / noCtaAvg : 1;
      if (multiplier > 1.2) {
        insights.push({
          insightType: 'cta_style',
          pattern: 'has_cta',
          multiplier,
          sampleSize: withCta.length,
          metadata: { ctaAvg, noCtaAvg },
        });
      }
    }

    // Upsert insights
    for (const insight of insights) {
      const confidence = Math.min(1, insight.sampleSize / 20);
      await this.prisma.performanceInsight.upsert({
        where: {
          teamId_insightType_pattern: {
            teamId,
            insightType: insight.insightType,
            pattern: insight.pattern,
          },
        },
        create: {
          teamId,
          insightType: insight.insightType,
          pattern: insight.pattern,
          multiplier: insight.multiplier,
          confidence,
          sampleSize: insight.sampleSize,
          metadata: insight.metadata as any,
        },
        update: {
          multiplier: insight.multiplier,
          confidence,
          sampleSize: insight.sampleSize,
          metadata: insight.metadata as any,
          updatedAt: new Date(),
        },
      });
    }

    return { insightsFound: insights.length, postsAnalyzed: posts.length };
  }

  async getTeamInsights(teamId: string): Promise<InsightSummary[]> {
    const insights = await this.prisma.performanceInsight.findMany({
      where: { teamId, isActive: true, confidence: { gte: 0.3 } },
      orderBy: { multiplier: 'desc' },
    });

    return insights.map(i => ({
      insightType: i.insightType,
      pattern: i.pattern,
      multiplier: i.multiplier,
      confidence: i.confidence,
      description: this.describeInsight(i.insightType, i.pattern, i.multiplier),
    }));
  }

  async getInsightsForGeneration(teamId: string): Promise<string[]> {
    const insights = await this.prisma.performanceInsight.findMany({
      where: { teamId, isActive: true, confidence: { gte: 0.4 }, multiplier: { gte: 1.3 } },
      orderBy: { multiplier: 'desc' },
      take: 5,
    });

    return insights.map(i => this.describeInsight(i.insightType, i.pattern, i.multiplier));
  }

  private detectHookType(content: string): string {
    const firstLine = content.split('\n')[0] ?? '';
    if (firstLine.includes('?')) return 'question';
    if (/^\d/.test(firstLine) || /\b\d+\s*(ways|tips|steps|reasons|mistakes)\b/i.test(firstLine)) return 'listicle';
    if (/^(stop|don't|never|avoid|warning)/i.test(firstLine)) return 'negative_hook';
    if (/^(how to|here's how|the secret|the truth)/i.test(firstLine)) return 'how_to';
    if (/^(I |My |We )/i.test(firstLine)) return 'personal_story';
    if (firstLine.length < 50) return 'short_punchy';
    return 'statement';
  }

  private detectContentFormat(content: string, mediaUrls: string[]): string {
    const hasMedia = mediaUrls && mediaUrls.length > 0;
    const hasMultipleMedia = mediaUrls && mediaUrls.length > 1;
    const hasList = content.includes('1.') || content.includes('- ') || content.includes('•');

    if (hasMultipleMedia) return 'carousel';
    if (hasMedia && content.length < 100) return 'image_minimal_text';
    if (hasMedia) return 'image_with_caption';
    if (hasList) return 'list_post';
    if (content.length > 500) return 'long_form';
    if (content.length < 100) return 'micro_content';
    return 'standard_text';
  }

  private describeInsight(type: string, pattern: string, multiplier: number): string {
    const pct = Math.round((multiplier - 1) * 100);
    const direction = pct > 0 ? 'more' : 'less';
    const absPct = Math.abs(pct);

    switch (type) {
      case 'hook_type':
        return `Posts with ${pattern.replace(/_/g, ' ')} hooks get ${absPct}% ${direction} engagement`;
      case 'posting_time':
        return `Posts at ${pattern.replace('hour_', '')}:00 get ${absPct}% ${direction} engagement`;
      case 'content_format':
        return `${pattern.replace(/_/g, ' ')} format gets ${absPct}% ${direction} engagement`;
      case 'cta_style':
        return `Posts with a clear CTA get ${absPct}% ${direction} engagement`;
      default:
        return `${pattern} pattern: ${absPct}% ${direction} engagement`;
    }
  }

  private groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
    const groups: Record<string, T[]> = {};
    for (const item of items) {
      const value = String(item[key] ?? 'unknown');
      if (!groups[value]) groups[value] = [];
      groups[value].push(item);
    }
    return groups;
  }
}
