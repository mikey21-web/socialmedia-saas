"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export interface PostSet {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface PostsetsState {
  sets: PostSet[];
  loading: boolean;
  error: string | null;
  fetchSets: () => Promise<void>;
  createSet: (name: string, description?: string) => Promise<void>;
  deleteSet: (id: string) => Promise<void>;
}

export const usePostsetsStore = create<PostsetsState>((set, get) => ({
  sets: [],
  loading: false,
  error: null,

  fetchSets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<PostSet[]>("/postsets");
      set({ sets: response.data, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch post sets",
      });
    }
  },

  createSet: async (name: string, description?: string) => {
    set({ loading: true, error: null });
    try {
      await api.post("/postsets", { name, description });
      await get().fetchSets();
      set({ loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to create post set",
      });
      throw err;
    }
  },

  deleteSet: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/postsets/${id}`);
      await get().fetchSets();
      set({ loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to delete post set",
      });
      throw err;
    }
  },
}));
