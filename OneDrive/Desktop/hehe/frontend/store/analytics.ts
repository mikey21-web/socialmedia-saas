"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type { Platform } from "@/components/platform-badge";

export type AnalyticsPreset = "7d" | "30d" | "90d" | "custom";

export interface AnalyticsPlatformSummary {
  platform: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface AnalyticsDaySummary {
  date: string;
  impressions: number;
  engagements: number;
}

export interface AnalyticsTopPost {
  postId: string;
  title: string;
  platform: string;
  impressions: number;
  engagements: number;
}

export interface AnalyticsSummary {
  totalImpressions: number;
  totalEngagements: number;
  totalReach: number;
  totalSaves: number;
  byPlatform: AnalyticsPlatformSummary[];
  byDay: AnalyticsDaySummary[];
  byDayPlatform: Array<Record<string, number | string>>;
  topPosts: AnalyticsTopPost[];
}

export interface PlatformROI {
  platform: string;
  impressions: number;
  engagements: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  posts: number;
  engagementRate: number;
}

export interface BestPostingTime {
  day: string;
  hour: number;
  avgEngagement: number;
}

export interface ContentTrends {
  topHashtags: Array<{ tag: string; count: number }>;
  contentTypeBreakdown: Array<{ type: string; count: number }>;
}

export interface FollowerGrowth {
  series: Array<Record<string, number | string>>;
  latestByPlatform: Record<string, number>;
  growthByPlatform: Record<string, number>;
}

export interface VideoMetrics {
  byPlatform: Array<{
    platform: string;
    totalVideoViews: number;
    avgWatchTime: number;
    avgCompletionRate: number;
    totalSaves: number;
  }>;
  topVideosByViews: Array<{
    postId: string;
    title: string;
    platform: string;
    videoViews: number;
    saves: number;
    completionRate: number;
  }>;
}

export interface PostingHeatmap {
  cells: Array<{ dow: number; hour: number; value: number }>;
  maxValue: number;
  bestSlots: Array<{ dow: number; hour: number; value: number }>;
}

export interface EngagementBenchmark {
  platform: string;
  yourRate: number;
  industryAvg: number;
  goodThreshold: number;
  rating: "excellent" | "good" | "average" | "below";
}

export interface CampaignSummary {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  postCount: number;
  totalImpressions: number;
  totalEngagements: number;
  engagementRate: number;
}

export interface Virality {
  topViralPosts: Array<{
    postId: string;
    title: string;
    platform: string;
    viralityScore: number;
    shares: number;
    comments: number;
    impressions: number;
  }>;
  avgViralityByPlatform: Array<{ platform: string; avgVirality: number }>;
}

export interface Demographics {
  platform: string;
  age: Array<{ bucket: string; value: number }>;
  gender: Array<{ bucket: string; value: number }>;
  country: Array<{ bucket: string; value: number }>;
  city: Array<{ bucket: string; value: number }>;
  recordedAt: string | null;
}

interface AnalyticsState {
  preset: AnalyticsPreset;
  from: string;
  to: string;
  summary: AnalyticsSummary | null;
  previousSummary: AnalyticsSummary | null;
  lastUpdated: string | null;
  loading: boolean;
  error: string | null;
  platformROI: PlatformROI[];
  bestPostingTimes: Record<string, BestPostingTime[]>;
  contentTrends: ContentTrends | null;
  followerGrowth: FollowerGrowth | null;
  videoMetrics: VideoMetrics | null;
  heatmap: PostingHeatmap | null;
  benchmarks: EngagementBenchmark[];
  campaigns: CampaignSummary[];
  activeCampaign: AnalyticsSummary | null;
  virality: Virality | null;
  demographics: Demographics | null;
  setRange: (preset: AnalyticsPreset, from: string, to: string) => void;
  fetchSummary: (from: string, to: string) => Promise<void>;
  fetchLastUpdated: () => Promise<void>;
  fetchPlatformROI: (from?: string, to?: string) => Promise<void>;
  fetchBestPostingTimes: () => Promise<void>;
  fetchContentTrends: () => Promise<void>;
  fetchFollowerGrowth: (from?: string, to?: string) => Promise<void>;
  fetchVideoMetrics: (from?: string, to?: string) => Promise<void>;
  fetchHeatmap: () => Promise<void>;
  fetchBenchmarks: (from?: string, to?: string) => Promise<void>;
  fetchCampaigns: () => Promise<void>;
  fetchCampaignStats: (campaignId: string) => Promise<void>;
  createCampaign: (input: { name: string; description?: string; startDate?: string; endDate?: string }) => Promise<void>;
  assignPostToCampaign: (campaignId: string, postId: string) => Promise<void>;
  fetchVirality: (from?: string, to?: string) => Promise<void>;
  fetchDemographics: (platform?: string) => Promise<void>;
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function shiftRange(from: string, to: string) {
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T23:59:59.999Z`);
  const diff = toDate.getTime() - fromDate.getTime() + 1;

  const previousTo = new Date(fromDate.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - diff + 1);

  return {
    from: previousFrom.toISOString(),
    to: previousTo.toISOString(),
  };
}

function createDefaultRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
  return {
    from: toIsoDate(start),
    to: toIsoDate(end),
  };
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  preset: "30d",
  ...createDefaultRange(),
  summary: null,
  previousSummary: null,
  lastUpdated: null,
  loading: false,
  error: null,
  platformROI: [],
  bestPostingTimes: {},
  contentTrends: null,
  followerGrowth: null,
  videoMetrics: null,
  heatmap: null,
  benchmarks: [],
  campaigns: [],
  activeCampaign: null,
  virality: null,
  demographics: null,

  setRange: (preset, from, to) => set({ preset, from, to }),

  fetchLastUpdated: async () => {
    try {
      const response = await api.get<{ lastUpdated: string | null }>('/analytics/last-updated');
      set({ lastUpdated: response.data.lastUpdated });
    } catch {
      set({ lastUpdated: null });
    }
  },

  fetchSummary: async (from, to) => {
    set({ loading: true, error: null });

    try {
      const [summaryResponse, previousResponse] = await Promise.all([
        api.get<AnalyticsSummary>("/analytics/summary", {
          params: {
            from: new Date(`${from}T00:00:00.000Z`).toISOString(),
            to: new Date(`${to}T23:59:59.999Z`).toISOString(),
          },
        }),
        api.get<AnalyticsSummary>("/analytics/summary", {
          params: shiftRange(from, to),
        }),
      ]);

      set({
        summary: summaryResponse.data,
        previousSummary: previousResponse.data,
        loading: false,
        from,
        to,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to fetch analytics summary",
      });
    }
  },

  fetchPlatformROI: async (from?, to?) => {
    try {
      const params: Record<string, string> = {};
      if (from) params.startDate = new Date(`${from}T00:00:00.000Z`).toISOString();
      if (to) params.endDate = new Date(`${to}T23:59:59.999Z`).toISOString();
      const response = await api.get<PlatformROI[]>("/analytics/platform-roi", { params });
      set({ platformROI: response.data });
    } catch {
      set({ platformROI: [] });
    }
  },

  fetchBestPostingTimes: async () => {
    try {
      const response = await api.get<Record<string, BestPostingTime[]>>("/analytics/best-posting-times");
      set({ bestPostingTimes: response.data });
    } catch {
      set({ bestPostingTimes: {} });
    }
  },

  fetchContentTrends: async () => {
    try {
      const response = await api.get<ContentTrends>("/analytics/content-trends");
      set({ contentTrends: response.data });
    } catch {
      set({ contentTrends: null });
    }
  },

  fetchFollowerGrowth: async (from?, to?) => {
    try {
      const params: Record<string, string> = {};
      if (from) params.startDate = new Date(`${from}T00:00:00.000Z`).toISOString();
      if (to) params.endDate = new Date(`${to}T23:59:59.999Z`).toISOString();
      const response = await api.get<FollowerGrowth>("/analytics/follower-growth", { params });
      set({ followerGrowth: response.data });
    } catch {
      set({ followerGrowth: null });
    }
  },

  fetchVideoMetrics: async (from?, to?) => {
    try {
      const params: Record<string, string> = {};
      if (from) params.startDate = new Date(`${from}T00:00:00.000Z`).toISOString();
      if (to) params.endDate = new Date(`${to}T23:59:59.999Z`).toISOString();
      const response = await api.get<VideoMetrics>("/analytics/video-metrics", { params });
      set({ videoMetrics: response.data });
    } catch {
      set({ videoMetrics: null });
    }
  },

  fetchHeatmap: async () => {
    try {
      const response = await api.get<PostingHeatmap>("/analytics/posting-heatmap");
      set({ heatmap: response.data });
    } catch {
      set({ heatmap: null });
    }
  },

  fetchBenchmarks: async (from?, to?) => {
    try {
      const params: Record<string, string> = {};
      if (from) params.startDate = new Date(`${from}T00:00:00.000Z`).toISOString();
      if (to) params.endDate = new Date(`${to}T23:59:59.999Z`).toISOString();
      const response = await api.get<EngagementBenchmark[]>("/analytics/engagement-benchmarks", { params });
      set({ benchmarks: response.data });
    } catch {
      set({ benchmarks: [] });
    }
  },

  fetchCampaigns: async () => {
    try {
      const response = await api.get<CampaignSummary[]>("/analytics/campaigns");
      set({ campaigns: response.data });
    } catch {
      set({ campaigns: [] });
    }
  },

  fetchCampaignStats: async (campaignId) => {
    try {
      const response = await api.get<AnalyticsSummary>(`/analytics/campaigns/${campaignId}/stats`);
      set({ activeCampaign: response.data });
    } catch {
      set({ activeCampaign: null });
    }
  },

  createCampaign: async (input) => {
    await api.post("/analytics/campaigns", input);
    const response = await api.get<CampaignSummary[]>("/analytics/campaigns");
    set({ campaigns: response.data });
  },

  assignPostToCampaign: async (campaignId, postId) => {
    await api.patch(`/analytics/campaigns/${campaignId}/posts`, { postId });
  },

  fetchVirality: async (from?, to?) => {
    try {
      const params: Record<string, string> = {};
      if (from) params.startDate = new Date(`${from}T00:00:00.000Z`).toISOString();
      if (to) params.endDate = new Date(`${to}T23:59:59.999Z`).toISOString();
      const response = await api.get<Virality>("/analytics/virality", { params });
      set({ virality: response.data });
    } catch {
      set({ virality: null });
    }
  },

  fetchDemographics: async (platform?) => {
    try {
      const params: Record<string, string> = {};
      if (platform) params.platform = platform;
      const response = await api.get<Demographics>("/analytics/demographics", { params });
      set({ demographics: response.data });
    } catch {
      set({ demographics: null });
    }
  },
}));

export const PLATFORM_HEX: Record<Platform, string> = {
  twitter: "#38bdf8",
  instagram: "#f472b6",
  linkedin: "#60a5fa",
  facebook: "#818cf8",
  youtube: "#f87171",
  tiktok: "#f8fafc",
};
