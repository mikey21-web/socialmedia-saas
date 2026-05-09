export interface ContentBrief {
  date: string;
  pillarTopic: string;
  contentType: 'educational' | 'promotional' | 'trending' | 'ugc' | 'behind_scenes';
  platform: string;
  targetWordCount: number;
  notes: string;
  trendSignalId?: string;
}

export interface CompetitorReport {
  competitors: {
    handle: string;
    platform: string;
    postingFrequency: string;
    topTopics: string[];
    engagementRate: string;
    strengths: string[];
    weaknesses: string[];
  }[];
  opportunities: string[];
  threats: string[];
}

export interface DailyInsight {
  date: string;
  topPosts: { postId: string; title: string; impressions: number }[];
  underperformers: { postId: string; title: string; impressions: number }[];
  insights: string[];
  recommendations: string[];
  needsAdjustment: boolean;
}

export interface WeeklyReport {
  summary: string;
  topPosts: { postId: string; title: string; impressions: number; engagements: number }[];
  underperformers: { postId: string; title: string; impressions: number }[];
  insights: string[];
  recommendations: string[];
  followerGrowth: Record<string, number>;
  engagementRate: Record<string, number>;
}

export interface WinningPatterns {
  topics: string[];
  formats: string[];
  timings: { platform: string; bestTime: string }[];
  hashtags: string[];
}

export interface AgentRunInput {
  teamId: string;
  agentRole: string;
  triggerType: 'scheduled' | 'manual' | 'trend' | 'engagement';
}
