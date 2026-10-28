export const PLATFORMS = [
  'linkedin',
  'x',
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_META: Record<
  Platform,
  { label: string; short: string; color: string; limit: number }
> = {
  linkedin: { label: 'LinkedIn', short: 'in', color: '#0a66c2', limit: 3000 },
  x: { label: 'X / Twitter', short: 'X', color: '#e7e9ea', limit: 280 },
  instagram: { label: 'Instagram', short: 'ig', color: '#e1306c', limit: 2200 },
  facebook: { label: 'Facebook', short: 'fb', color: '#1877f2', limit: 63206 },
  tiktok: { label: 'TikTok', short: 'tt', color: '#25f4ee', limit: 2200 },
  youtube: { label: 'YouTube', short: 'yt', color: '#ff0033', limit: 5000 },
};

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type Tone = 'professional' | 'casual' | 'funny' | 'inspirational' | 'bold';

export interface Profile {
  id: number;
  name: string;
  email: string;
  company: string;
  role: string;
  niche: string;
  website: string;
  tone: Tone;
  brandVoice: string;
  signature: string;
  followers: number;
  updatedAt: string;
}

export interface Account {
  id: number;
  platform: Platform;
  handle: string;
  displayName: string;
  status: 'connected' | 'disconnected';
  mode: 'demo' | 'live';
  expiresAt: string | null;
  hasToken: boolean;
  meta: AccountMeta;
  connectedAt: string | null;
  updatedAt: string;
}

export interface AccountMeta {
  personUrn?: string;
  profileUrl?: string;
  lastError?: string;
  [key: string]: unknown;
}

export interface Post {
  id: number;
  content: string;
  hashtags: string[];
  platforms: Platform[];
  status: PostStatus;
  tone: Tone | null;
  topic: string | null;
  source: 'manual' | 'ai' | 'seed';
  scheduledAt: string | null;
  publishedAt: string | null;
  externalUrl: string | null;
  error: string | null;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: number;
  type: string;
  message: string;
  postId: number | null;
  createdAt: string;
}

export interface AnalyticsPoint {
  date: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

export interface PlatformAnalytics {
  platform: Platform;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  posts: number;
  engagementRate: number;
}

export interface DashboardData {
  profile: Profile;
  totals: {
    posts: number;
    published: number;
    scheduled: number;
    drafts: number;
    failed: number;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    engagementRate: number;
    followers: number;
  };
  accounts: Account[];
  analytics: AnalyticsPoint[];
  platformBreakdown: PlatformAnalytics[];
  upcoming: Post[];
  recentPosts: Post[];
  activity: ActivityItem[];
  ai: { configured: boolean; mode: 'live' | 'mock'; model: string };
  scheduler: { enabled: boolean; autopilot: boolean; lastRun: string | null; publishedLastRun: number };
}

export interface GeneratedPost {
  platform: Platform;
  content: string;
  hashtags: string[];
  tone: Tone;
}

export interface CreatePostInput {
  content: string;
  hashtags?: string[];
  platforms: Platform[];
  status?: PostStatus;
  scheduledAt?: string | null;
  tone?: Tone | null;
  topic?: string | null;
  source?: 'manual' | 'ai' | 'seed';
}

