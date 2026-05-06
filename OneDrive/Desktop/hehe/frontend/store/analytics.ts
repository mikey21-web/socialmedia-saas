"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type { Platform } from "@/components/platform-badge";

export type AnalyticsPreset = "7d" | "30d" | "90d" | "custom";

export interface AnalyticsPlatformSummary {
  platform: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
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
  byPlatform: AnalyticsPlatformSummary[];
  byDay: AnalyticsDaySummary[];
  byDayPlatform: Array<Record<string, number | string>>;
  topPosts: AnalyticsTopPost[];
}

interface AnalyticsState {
  preset: AnalyticsPreset;
  from: string;
  to: string;
  summary: AnalyticsSummary | null;
  previousSummary: AnalyticsSummary | null;
  loading: boolean;
  error: string | null;
  setRange: (preset: AnalyticsPreset, from: string, to: string) => void;
  fetchSummary: (from: string, to: string) => Promise<void>;
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
  loading: false,
  error: null,

  setRange: (preset, from, to) => set({ preset, from, to }),

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
}));

export const PLATFORM_HEX: Record<Platform, string> = {
  twitter: "#38bdf8",
  instagram: "#f472b6",
  linkedin: "#60a5fa",
  facebook: "#818cf8",
  youtube: "#f87171",
  tiktok: "#f8fafc",
};
