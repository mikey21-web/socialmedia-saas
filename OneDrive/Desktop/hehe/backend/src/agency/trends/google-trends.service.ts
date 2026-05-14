import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Real Google Trends integration.
 * Uses the unofficial google-trends-api package (no API key needed).
 * Fetches actual trending searches and related topics for India.
 *
 * This replaces the LLM-generated synthetic trends with real data.
 */

interface TrendingSearch {
  title: string;
  formattedTraffic: string;
  relatedQueries: string[];
  articles: Array<{ title: string; url: string }>;
}

interface RelatedTopic {
  topic: string;
  value: number;
  type: 'rising' | 'top';
}

@Injectable()
export class GoogleTrendsService {
  private readonly logger = new Logger(GoogleTrendsService.name);
  private googleTrends: typeof import('google-trends-api') | null = null;

  constructor(private readonly prisma: PrismaService) {
    this.loadModule();
  }

  private async loadModule() {
    try {
      this.googleTrends = await import('google-trends-api');
    } catch (err) {
      this.logger.warn('google-trends-api not available, Google Trends will be disabled');
    }
  }

  /**
   * Fetch daily trending searches for India.
   * Returns real trending topics that people are searching for right now.
   */
  async getDailyTrending(geo: string = 'IN'): Promise<TrendingSearch[]> {
    if (!this.googleTrends) return [];

    try {
      const result = await this.googleTrends.dailyTrends({ geo });
      const parsed = JSON.parse(result);
      const days = parsed?.default?.trendingSearchesDays ?? [];

      const trends: TrendingSearch[] = [];
      for (const day of days.slice(0, 2)) {
        for (const search of day.trendingSearches ?? []) {
          trends.push({
            title: search.title?.query ?? '',
            formattedTraffic: search.formattedTraffic ?? '0',
            relatedQueries: (search.relatedQueries ?? []).map((q: { query: string }) => q.query),
            articles: (search.articles ?? []).slice(0, 3).map((a: { title: string; url: string }) => ({
              title: a.title,
              url: a.url,
            })),
          });
        }
      }

      return trends;
    } catch (err) {
      this.logger.warn(`Google daily trends failed: ${(err as Error)?.message}`);
      return [];
    }
  }

  /**
   * Fetch real-time trending searches (last 24 hours).
   */
  async getRealTimeTrending(geo: string = 'IN', category: string = 'all'): Promise<TrendingSearch[]> {
    if (!this.googleTrends) return [];

    try {
      const categoryMap: Record<string, string> = {
        all: 'all',
        business: 'b',
        entertainment: 'e',
        health: 'm',
        science: 't',
        sports: 's',
        top: 'h',
      };

      const result = await this.googleTrends.realTimeTrends({
        geo,
        category: categoryMap[category] ?? 'all',
      });

      const parsed = JSON.parse(result);
      const stories = parsed?.storySummaries?.trendingStories ?? [];

      return stories.slice(0, 20).map((story: any) => ({
        title: story.title ?? story.entityNames?.[0] ?? '',
        formattedTraffic: story.articles?.length ? `${story.articles.length} articles` : '0',
        relatedQueries: (story.entityNames ?? []).slice(0, 5),
        articles: (story.articles ?? []).slice(0, 3).map((a: any) => ({
          title: a.articleTitle ?? '',
          url: a.url ?? '',
        })),
      }));
    } catch (err) {
      this.logger.warn(`Google real-time trends failed: ${(err as Error)?.message}`);
      return [];
    }
  }

  /**
   * Get interest over time for a specific keyword.
   * Useful for validating if a trend is rising or falling.
   */
  async getInterestOverTime(keyword: string, geo: string = 'IN'): Promise<Array<{ date: string; value: number }>> {
    if (!this.googleTrends) return [];

    try {
      const result = await this.googleTrends.interestOverTime({
        keyword,
        geo,
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
      });

      const parsed = JSON.parse(result);
      const timeline = parsed?.default?.timelineData ?? [];

      return timeline.map((point: { formattedTime: string; value: number[] }) => ({
        date: point.formattedTime,
        value: point.value?.[0] ?? 0,
      }));
    } catch (err) {
      this.logger.warn(`Interest over time failed for "${keyword}": ${(err as Error)?.message}`);
      return [];
    }
  }

  /**
   * Get related queries for a keyword.
   * Useful for finding content angles around a trending topic.
   */
  async getRelatedQueries(keyword: string, geo: string = 'IN'): Promise<{
    rising: RelatedTopic[];
    top: RelatedTopic[];
  }> {
    if (!this.googleTrends) return { rising: [], top: [] };

    try {
      const result = await this.googleTrends.relatedQueries({
        keyword,
        geo,
      });

      const parsed = JSON.parse(result);
      const data = parsed?.default?.rankedList ?? [];

      const rising: RelatedTopic[] = [];
      const top: RelatedTopic[] = [];

      for (const list of data) {
        for (const item of list.rankedKeyword ?? []) {
          const topic: RelatedTopic = {
            topic: item.query ?? '',
            value: item.value ?? 0,
            type: item.formattedValue === 'Breakout' ? 'rising' : 'top',
          };
          if (topic.type === 'rising') rising.push(topic);
          else top.push(topic);
        }
      }

      return { rising: rising.slice(0, 10), top: top.slice(0, 10) };
    } catch (err) {
      this.logger.warn(`Related queries failed for "${keyword}": ${(err as Error)?.message}`);
      return { rising: [], top: [] };
    }
  }

  /**
   * Scan Google Trends and store as TrendSignal records.
   * Called by the TrendMonitorService hourly scan.
   */
  async scanAndStore(): Promise<number> {
    const [daily, realtime] = await Promise.all([
      this.getDailyTrending('IN'),
      this.getRealTimeTrending('IN'),
    ]);

    const allTrends = [...daily, ...realtime];
    if (allTrends.length === 0) return 0;

    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    let created = 0;

    for (const trend of allTrends.slice(0, 30)) {
      if (!trend.title) continue;

      try {
        // Check if already exists (avoid duplicates)
        const existing = await this.prisma.trendSignal.findFirst({
          where: {
            platform: 'google',
            value: trend.title,
            expiresAt: { gt: new Date() },
          },
        });

        if (existing) continue;

        // Parse traffic number
        const trafficStr = trend.formattedTraffic.replace(/[^0-9KkMm+]/g, '');
        let popularity = 0;
        if (trafficStr.includes('M') || trafficStr.includes('m')) {
          popularity = parseFloat(trafficStr) * 1000000;
        } else if (trafficStr.includes('K') || trafficStr.includes('k')) {
          popularity = parseFloat(trafficStr) * 1000;
        } else {
          popularity = parseInt(trafficStr, 10) || 100;
        }

        await this.prisma.trendSignal.create({
          data: {
            platform: 'google',
            signalType: 'topic',
            value: trend.title,
            metadata: {
              formattedTraffic: trend.formattedTraffic,
              relatedQueries: trend.relatedQueries,
              articles: trend.articles,
            },
            popularity: Math.min(popularity, 10000000),
            velocity: trend.relatedQueries.length > 3 ? 2.0 : 1.0,
            category: this.inferCategory(trend.title, trend.relatedQueries),
            expiresAt,
          },
        });

        created++;
      } catch (err) {
        this.logger.warn(`Failed to store trend "${trend.title}": ${(err as Error)?.message}`);
      }
    }

    this.logger.log(`Google Trends: stored ${created} new signals from ${allTrends.length} trends`);
    return created;
  }

  /**
   * Infer a category from the trend title and related queries.
   * Maps to our vertical profiles for relevance filtering.
   */
  private inferCategory(title: string, relatedQueries: string[]): string {
    const combined = `${title} ${relatedQueries.join(' ')}`.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      'tech-startup': ['tech', 'ai', 'startup', 'software', 'app', 'digital', 'crypto', 'blockchain'],
      'food-beverage': ['food', 'restaurant', 'recipe', 'cooking', 'cafe', 'biryani', 'pizza', 'delivery'],
      'health-wellness': ['health', 'fitness', 'yoga', 'gym', 'diet', 'wellness', 'medical', 'doctor'],
      'fashion-d2c': ['fashion', 'clothing', 'style', 'beauty', 'makeup', 'skincare', 'salon'],
      'real-estate': ['property', 'real estate', 'flat', 'apartment', 'house', 'rent', 'buy'],
      'education': ['education', 'exam', 'college', 'university', 'course', 'study', 'school'],
      'finance': ['stock', 'market', 'investment', 'bank', 'loan', 'mutual fund', 'crypto'],
      'ecommerce': ['sale', 'discount', 'shopping', 'amazon', 'flipkart', 'offer', 'deal'],
      'entertainment': ['movie', 'film', 'music', 'cricket', 'ipl', 'bollywood', 'series', 'game'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => combined.includes(kw))) {
        return category;
      }
    }

    return 'general';
  }
}
