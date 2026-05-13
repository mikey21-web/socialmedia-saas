export interface PostMetric {
  postId: string;
  platform: string;
  impressions: number;
  engagements: number;
  engagement_rate: number;
  clicks: number;
  saves: number;
  shares: number;
}

export interface DashboardPost {
  id: string;
  content: string;
  platforms: string[];
  status: 'draft' | 'scheduled' | 'published';
  metrics?: PostMetric;
  publishedAt?: Date;
  scheduledFor?: Date;
}

export interface AnalyticsMetrics {
  totalImpressions: number;
  totalEngagements: number;
  averageEngagementRate: number;
  topPost: DashboardPost;
  weeklyTrend: { date: string; value: number }[];
}

export interface Trend {
  topic: string;
  mentions: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  platforms: string[];
}

export interface Recommendation {
  id: string;
  type: 'post_idea' | 'optimization' | 'trend' | 'engagement';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
}
