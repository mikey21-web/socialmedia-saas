# Advanced Analytics Implementation Plan — MVP Feature

## Overview
Advanced analytics tracks post performance, audience engagement, and trends across all integrated social platforms. This is a **must-have** MVP feature matching Postiz's capability level.

---

## 1. Core Metrics by Platform

### X (Twitter)
- **Post-level**: Impressions, engagements (likes, retweets, replies), engagement rate, click-through rate
- **Timeline**: View counts, reach, reply counts
- **API**: Twitter API v2 `/tweets/{id}` with metrics extension

### Instagram
- **Post-level**: Impressions, reach, engagement (likes, comments, saves), engagement rate, save rate
- **Story**: Views, exits, replies
- **API**: Instagram Graph API `/insights` endpoint on media/story objects

### LinkedIn
- **Post-level**: Impressions, clicks, comments, shares, engagement rate
- **Follower growth**: Weekly follower count change
- **API**: LinkedIn Share Activity API `/articles/{urn}/shares`

### Facebook
- **Post-level**: Impressions, reach, engagement (reactions, comments, shares), click-through rate
- **Demographics**: Age, gender, location of engagers
- **API**: Facebook Insights API `/insights` endpoint

### TikTok
- **Post-level**: Video views, likes, comments, shares, completion rate
- **Hashtag/trend**: Trending sounds, hashtags used
- **API**: TikTok Analytics API (requires business account)

### YouTube
- **Video-level**: Views, watch time (hours), likes, comments, shares, average view duration, click-through rate
- **Subscriber growth**: New subscriber count
- **API**: YouTube Analytics API `reports.query()`

### Bluesky/Mastodon/Threads
- **Post-level**: Reposts, likes, replies, bookmarks
- **API**: Varies per platform (Bluesky Firehose, Mastodon API, Threads Graph API)

---

## 2. Database Schema Extensions

```prisma
// Analytics aggregation table (hourly/daily snapshots)
model PostAnalytics {
  id                String   @id @default(cuid())
  postId            String
  post              Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  platform          String   // 'twitter', 'instagram', 'linkedin', etc.
  platformPostId    String   // The actual post ID from social platform
  
  // Core metrics (snapshot at collection time)
  impressions       Int      @default(0)
  reach             Int      @default(0)
  engagements       Int      @default(0)  // Total: likes + comments + shares
  engagement_rate   Float    @default(0)
  
  // Platform-specific metrics (JSON flexible schema)
  platform_metrics  Json     // {"likes": 10, "retweets": 5, "replies": 2, "views": 1000}
  demographics      Json?    // {"age_groups": {...}, "regions": {...}}
  
  collectedAt       DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([postId, platform, collectedAt])
  @@index([postId, platform])
  @@index([collectedAt])
}

// Hourly/daily analytics summary (for dashboard aggregation)
model AnalyticsSummary {
  id                String   @id @default(cuid())
  postId            String
  post              Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  period            String   // 'hourly', 'daily', 'weekly'
  periodStart       DateTime
  periodEnd         DateTime
  
  // Aggregated across all platforms for this post
  totalImpressions  Int      @default(0)
  totalEngagements  Int      @default(0)
  averageEngagement Float    @default(0)
  
  // Best performing platform
  topPlatform       String?
  topPlatformMetrics Json?
  
  createdAt         DateTime @default(now())
  
  @@unique([postId, period, periodStart])
  @@index([postId])
  @@index([periodStart])
}

// Organization-level analytics (aggregate across all posts)
model OrgAnalytics {
  id                    String   @id @default(cuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  period                String   // 'daily', 'weekly', 'monthly'
  periodStart           DateTime
  periodEnd             DateTime
  
  totalPostsPublished   Int      @default(0)
  totalImpressions      Int      @default(0)
  totalEngagements      Int      @default(0)
  averageEngagementRate Float    @default(0)
  
  // Growth metrics
  followerGrowth        Int      @default(0)
  newFollowers          Int      @default(0)
  
  // Trending content
  topPostId             String?
  topContentType        String?  // 'image', 'video', 'carousel', 'text'
  topPlatform           String?
  
  topHashtags           Json?    // [{tag: "#ai", count: 45}, ...]
  topMentions           Json?    // [{handle: "@username", count: 12}, ...]
  
  createdAt             DateTime @default(now())
  
  @@unique([organizationId, period, periodStart])
  @@index([organizationId])
  @@index([periodStart])
}
```

---

## 3. Collection Strategy

### Real-Time Collection (Near-Real-Time via Webhooks)
**Best for**: Initial 24 hours post-publish to catch peak engagement
- Instagram Webhooks: Real-time comment/like notifications
- Twitter Webhooks: (Limited) Use polling every 5 minutes
- Facebook Webhooks: Real-time engagement notifications

**Implementation**:
```typescript
// Temporal workflow trigger on post publish
const publishWorkflow = async (postId: string, platforms: string[]) => {
  // Publish to platforms
  
  // Trigger analytics collection workflow
  await client.workflow.start(analyticsCollectionWorkflow, {
    args: [postId, platforms],
    workflowId: `analytics-${postId}`,
  });
};

// Temporal workflow for analytics collection
const analyticsCollectionWorkflow = defineWorkflow({
  async execute(postId: string, platforms: string[]) {
    // Hour 1: Check every 5 minutes (6 times)
    // Hour 2-6: Check every 30 minutes (10 times)
    // Day 1-7: Check once daily (7 times)
    // Day 8+: Check weekly
    
    for (let i = 0; i < 6; i++) {
      await sleep('5m');
      await activities.fetchPostAnalytics(postId, platforms);
    }
    
    for (let i = 0; i < 10; i++) {
      await sleep('30m');
      await activities.fetchPostAnalytics(postId, platforms);
    }
    
    for (let i = 0; i < 7; i++) {
      await sleep('1d');
      await activities.fetchPostAnalytics(postId, platforms);
    }
    
    // Weekly thereafter
    await activities.scheduleWeeklyAnalytics(postId);
  },
});
```

### Batch Collection (Daily/Weekly Aggregates)
**Best for**: Trend analysis, organization-level metrics
- Daily batch at 2 AM UTC: Fetch previous 24h analytics for all posts
- Weekly batch on Monday 3 AM UTC: Aggregate weekly summaries
- Monthly batch on 1st of month 4 AM UTC: Aggregate monthly data

```typescript
const dailyAnalyticsAggregation = defineWorkflow({
  async execute() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get all posts published in last 7 days
    const recentPosts = await activities.getRecentPosts(7);
    
    for (const post of recentPosts) {
      await activities.fetchPostAnalytics(post.id, post.platforms);
    }
    
    // Aggregate to OrgAnalytics
    await activities.aggregateOrgAnalytics(yesterday);
  },
});
```

---

## 4. API Endpoints for Analytics

### Fetch Post-Level Analytics
```
GET /api/analytics/posts/:postId
Query params: ?period=hourly|daily|weekly&from=timestamp&to=timestamp&platform=all|twitter|instagram

Response:
{
  postId: string,
  platforms: [{
    platform: string,
    platformPostId: string,
    dataPoints: [{
      timestamp: ISO,
      impressions: number,
      engagements: number,
      engagement_rate: number,
      platform_metrics: {}
    }]
  }],
  summary: {
    totalImpressions: number,
    totalEngagements: number,
    averageEngagementRate: number
  }
}
```

### Fetch Organization Analytics
```
GET /api/analytics/org
Query params: ?period=daily|weekly|monthly&from=timestamp&to=timestamp

Response:
{
  period: string,
  totalPostsPublished: number,
  totalImpressions: number,
  totalEngagements: number,
  averageEngagementRate: number,
  followerGrowth: {
    newFollowers: number,
    growth_rate: number
  },
  topPosts: [{postId, platform, impressions, engagements}],
  platformBreakdown: [{platform, impressions, engagements}],
  contentTypeBreakdown: [{type, impressions, engagements}],
  topHashtags: [{tag, usage_count}],
  trends: [{trend, score}]
}
```

### Real-Time Post Status
```
GET /api/posts/:postId/live-status
Response:
{
  postId: string,
  status: 'scheduled' | 'published' | 'completed',
  published_at: ISO,
  platforms: [{
    platform: string,
    status: 'pending' | 'published' | 'failed',
    current_metrics: {
      impressions: number,
      engagements: number,
      engagement_rate: number
    },
    updated_at: ISO
  }]
}
```

---

## 5. Frontend Dashboard Components

### Post Performance Card (Single Post)
- Line chart: Impressions/engagements over time
- Platform tabs: Switch between X, Instagram, LinkedIn, etc.
- Metric boxes: Impressions, Engagements, Engagement Rate, Reach
- Real-time indicator: Shows "last updated 2 minutes ago"

### Organization Dashboard (Aggregate)
- Date range picker: Last 7 days, 30 days, 90 days, custom
- KPI cards: Total Impressions, Total Engagements, Avg Engagement Rate, Follower Growth
- Platform breakdown: Pie chart or bar chart (Instagram 40%, X 35%, LinkedIn 25%)
- Content type breakdown: Images vs Videos vs Carousels engagement comparison
- Top posts: Table showing top 5 posts by engagement
- Trends: Line chart showing impressions/engagement trend over selected period
- Hashtag cloud: Word cloud of most-used hashtags
- Demographics: (If available) Age/gender/location breakdown of audience

### Real-Time Monitoring View (Optional for MVP+1)
- Live feed of posts being published
- Real-time engagement counter for last published post
- Alert when post hits milestones (1K impressions, 100 engagements)

---

## 6. Caching Strategy (Redis)

```typescript
// Cache keys
const cacheKeys = {
  // 5-minute TTL for live metrics
  postLiveMetrics: (postId: string) => `analytics:post:live:${postId}`,
  
  // 1-hour TTL for hourly aggregates
  postHourlyAnalytics: (postId: string, hour: string) => `analytics:post:hourly:${postId}:${hour}`,
  
  // 24-hour TTL for daily aggregates
  orgDailyAnalytics: (orgId: string, date: string) => `analytics:org:daily:${orgId}:${date}`,
  
  // 7-day TTL for top posts
  topPostsCache: (orgId: string) => `analytics:top:${orgId}`,
};

// Cache invalidation
const invalidatePostAnalytics = async (postId: string) => {
  await redis.del(cacheKeys.postLiveMetrics(postId));
  // Keep hourly caches (immutable after hour closes)
};

const invalidateOrgAnalytics = async (orgId: string) => {
  const today = new Date().toISOString().split('T')[0];
  await redis.del(cacheKeys.orgDailyAnalytics(orgId, today));
  await redis.del(cacheKeys.topPostsCache(orgId));
};
```

---

## 7. Implementation Phases (3-4 week MVP)

### Week 1: Foundation
- [ ] Database schema (PostAnalytics, AnalyticsSummary, OrgAnalytics tables)
- [ ] Temporal workflow for post-publish → analytics collection trigger
- [ ] Platform API integrations for fetching metrics (Twitter, Instagram, LinkedIn, Facebook)
- [ ] Create AnalyticsService with `fetchPostMetrics()` method
- [ ] Implement 1-hour real-time collection workflow

### Week 2: APIs & Aggregation
- [ ] Build analytics endpoints (`GET /api/analytics/posts/:id`, `GET /api/analytics/org`)
- [ ] Implement daily batch aggregation workflow
- [ ] Add Redis caching layer
- [ ] Test with live posts (publish test posts, verify metrics collection)

### Week 3: Dashboard
- [ ] Create post performance card component (SWR + Chart.js or Recharts)
- [ ] Build org dashboard with KPI cards, platform breakdown, top posts
- [ ] Add date range picker and period controls
- [ ] Real-time indicator (last updated timestamp)

### Week 4: Polish & Scaling
- [ ] Optimize batch queries (pagination, indexing)
- [ ] Add email/export functionality (weekly analytics digest via Resend)
- [ ] Performance tuning (Redis warming, query optimization)
- [ ] Edge cases (deleted posts, revoked integrations, failed API calls)

---

## 8. Cost Analysis (Included in MVP)

| Service | Cost | Notes |
|---------|------|-------|
| Platform APIs | Free (authenticated) | Twitter, Instagram, LinkedIn, Facebook provide free analytics via official APIs |
| Redis (analytics caching) | $0 (included in existing Upstash instance) | Minimal additional cost |
| Data storage (PostAnalytics tables) | Negligible | ~1KB per post per collection |
| **Total Monthly Cost** | **$0 additional** | All costs covered by existing infrastructure |

---

## 9. Key Implementation Notes

1. **Error Handling**: Some platforms don't provide full analytics immediately. Retry 3x with 5-minute backoff.
2. **Rate Limits**: Batch requests using platform API batch endpoints where available.
3. **Authentication**: Ensure refresh tokens are fresh before fetching (tie into existing token refresh workflow).
4. **Historical Data**: When first connecting a platform, fetch up to 90 days of historical analytics (varies by platform API limits).
5. **Competitor Advantage**: Postiz shows basic analytics. Add sentiment analysis (optional MVP+1) using Claude API on comments/replies for deeper insights.

---

## Next Step
Start Week 1 by creating the database migration and AnalyticsService. Should take 1-2 days.
