import Parser from 'rss-parser';

export interface RawTrend {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: Date;
}

const parser = new Parser({ timeout: 8000 });

const INDUSTRY_FEEDS: Record<string, string[]> = {
  'fashion-d2c': [
    'https://hypebeast.com/feed',
    'https://www.businessoffashion.com/rss.xml',
  ],
  saas: [
    'https://techcrunch.com/feed/',
    'https://www.producthunt.com/feed',
  ],
  'real-estate': ['https://www.inman.com/feed/'],
  fintech: ['https://techcrunch.com/category/fintech/feed/'],
  health: ['https://www.healthline.com/rss/news'],
  education: ['https://techcrunch.com/category/edtech/feed/'],
  default: [
    'https://techcrunch.com/feed/',
    'https://www.reddit.com/r/entrepreneur/.rss',
    'https://news.ycombinator.com/rss',
  ],
};

export async function fetchRssTrends(industry: string): Promise<RawTrend[]> {
  const urls = [
    ...(INDUSTRY_FEEDS[industry] ?? []),
    ...INDUSTRY_FEEDS.default,
  ];

  const uniqueUrls = [...new Set(urls)];
  const results: RawTrend[] = [];
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await Promise.allSettled(
    uniqueUrls.map(async (url) => {
      try {
        const feed = await parser.parseURL(url);
        const sourceName = feed.title ?? new URL(url).hostname;

        for (const item of feed.items.slice(0, 10)) {
          const pub = item.pubDate ? new Date(item.pubDate) : new Date();
          if (pub < cutoff) continue;

          results.push({
            title: item.title ?? '',
            summary: item.contentSnippet ?? item.content ?? item.title ?? '',
            url: item.link ?? url,
            source: sourceName,
            publishedAt: pub,
          });
        }
      } catch {
        // silently skip unreachable feeds
      }
    }),
  );

  return results;
}
