"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export interface MetricsData {
  postId: string;
  platforms: Record<string, {
    impressions: number;
    engagements: number;
    likes: number;
    retweets?: number;
    replies?: number;
    comments?: number;
    clicks?: number;
  }>;
  total: {
    impressions: number;
    engagements: number;
    likes: number;
    engagement_rate: string;
  };
  collected_at: string;
}

export interface ChartData {
  name: string;
  Impressions: number;
  Engagements: number;
}

export interface PlatformStats {
  name: string;
  posts: number;
  impressions: number;
  engagements: number;
}

interface AnalyticsState {
  metrics: MetricsData[];
  chartData: ChartData[];
  platformStats: PlatformStats[];
  loading: boolean;
  error: string | null;
  dateRange: "7d" | "30d" | "90d";
  setDateRange: (range: "7d" | "30d" | "90d") => void;
  fetchMetrics: () => Promise<void>;
  exportCSV: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  metrics: [],
  chartData: [],
  platformStats: [],
  loading: false,
  error: null,
  dateRange: "30d",

  setDateRange: (range) => set({ dateRange: range }),

  fetchMetrics: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<{
        metrics: MetricsData[];
        chartData: ChartData[];
        platformStats: PlatformStats[];
        total_impressions?: number;
        total_engagements?: number;
      }>("/analytics/team", {
        params: { range: get().dateRange },
      });

      const fallbackMetrics: MetricsData[] =
        response.data.metrics
        ?? (typeof response.data.total_impressions === "number"
          ? [{
            postId: "team",
            platforms: {},
            total: {
              impressions: response.data.total_impressions ?? 0,
              engagements: response.data.total_engagements ?? 0,
              likes: 0,
              engagement_rate: "0%",
            },
            collected_at: new Date().toISOString(),
          }]
          : []);

      set({
        metrics: fallbackMetrics,
        chartData: response.data.chartData || [],
        platformStats: response.data.platformStats || [],
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch analytics";
      set({ error: message, loading: false });
    }
  },

  exportCSV: () => {
    const { metrics } = get();
    if (metrics.length === 0) {
      alert("No data to export");
      return;
    }

    const rows = [["Post ID", "Platform", "Impressions", "Engagements", "Likes", "Collected At"]];

    metrics.forEach((m) => {
      Object.entries(m.platforms).forEach(([platform, stats]) => {
        rows.push([
          m.postId,
          platform,
          String(stats.impressions),
          String(stats.engagements),
          String(stats.likes),
          m.collected_at,
        ]);
      });
    });

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
}));
