// frontend/store/dashboard.ts
"use client";
import { create } from "zustand";
import { api } from "@/lib/api";

export interface DashboardSummary {
  postsTotal: number;
  postsPublished: number;
  postsScheduled: number;
  platformsConnected: number;
  sparklines: {
    followers: number[];
    engagement: number[];
    reach: number[];
  };
}

interface DashboardState {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  fetchSummary: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  loading: false,
  error: null,
  fetchSummary: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<DashboardSummary>("/dashboard/summary");
      set({ summary: res.data, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "fetch failed", loading: false });
    }
  },
}));
