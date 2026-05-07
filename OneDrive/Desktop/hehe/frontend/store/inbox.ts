"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export interface InboxPost {
  id: string;
  teamId: string;
  title: string;
  content: string;
  status: string;
  generatedBy: string | null;
  generationContext: any;
  agentRunId: string | null;
  rejectionReason: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  platforms: string[];
}

interface InboxState {
  posts: InboxPost[];
  total: number;
  page: number;
  loading: boolean;
  stats: { awaiting: number; approvedToday: number; rejectedToday: number } | null;
  fetchInbox: (filters?: { status?: string; platform?: string; page?: number }) => Promise<void>;
  fetchStats: () => Promise<void>;
  approvePost: (postId: string, scheduledAt?: string) => Promise<void>;
  rejectPost: (postId: string, reason?: string) => Promise<void>;
  editPost: (postId: string, updates: { content?: string; title?: string }) => Promise<void>;
  bulkApprove: (postIds: string[], scheduledAt?: string) => Promise<void>;
  bulkReject: (postIds: string[], reason?: string) => Promise<void>;
}

export const useInboxStore = create<InboxState>()((set, get) => ({
  posts: [],
  total: 0,
  page: 1,
  loading: false,
  stats: null,

  fetchInbox: async (filters) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.platform) params.set("platform", filters.platform);
      if (filters?.page) params.set("page", String(filters.page));
      const { data } = await api.get(`/inbox?${params.toString()}`);
      set({ posts: data.posts, total: data.total, page: data.page, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await api.get("/inbox/stats");
      set({ stats: data });
    } catch {}
  },

  approvePost: async (postId, scheduledAt) => {
    await api.post(`/inbox/${postId}/approve`, { scheduledAt });
    await get().fetchInbox();
    await get().fetchStats();
  },

  rejectPost: async (postId, reason) => {
    await api.post(`/inbox/${postId}/reject`, { reason });
    await get().fetchInbox();
    await get().fetchStats();
  },

  editPost: async (postId, updates) => {
    await api.patch(`/inbox/${postId}`, updates);
    await get().fetchInbox();
  },

  bulkApprove: async (postIds, scheduledAt) => {
    await api.post("/inbox/bulk-approve", { postIds, scheduledAt });
    await get().fetchInbox();
    await get().fetchStats();
  },

  bulkReject: async (postIds, reason) => {
    await api.post("/inbox/bulk-reject", { postIds, reason });
    await get().fetchInbox();
    await get().fetchStats();
  },
}));
