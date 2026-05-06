"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type { MediaAsset } from "@/lib/media";

export type MediaSourceFilter = "all" | "upload" | "generated";

interface FetchAssetsOptions {
  source?: MediaSourceFilter;
  tag?: string | null;
  page?: number;
  limit?: number;
  append?: boolean;
}

interface MediaState {
  assets: MediaAsset[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  loading: boolean;
  uploading: boolean;
  source: MediaSourceFilter;
  tag: string | null;
  error: string | null;
  fetchAssets: (options?: FetchAssetsOptions) => Promise<void>;
  loadMore: () => Promise<void>;
  setSource: (source: MediaSourceFilter) => void;
  setTag: (tag: string | null) => void;
  deleteAsset: (id: string) => Promise<void>;
  addTag: (id: string, tag: string) => Promise<void>;
  uploadAsset: (file: File) => Promise<MediaAsset>;
  generateAsset: (prompt: string) => Promise<MediaAsset>;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  assets: [],
  total: 0,
  page: 1,
  limit: 24,
  hasMore: false,
  loading: false,
  uploading: false,
  source: "all",
  tag: null,
  error: null,

  fetchAssets: async (options) => {
    const source = options?.source ?? get().source;
    const tag = options?.tag ?? get().tag;
    const page = options?.page ?? 1;
    const limit = options?.limit ?? get().limit;
    const append = options?.append ?? false;

    set({ loading: true, error: null });

    try {
      const response = await api.get<{
        assets: MediaAsset[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
      }>("/media/assets", {
        params: {
          page,
          limit,
          ...(source !== "all" ? { source } : {}),
          ...(tag ? { tag } : {}),
        },
      });

      set((state) => ({
        assets: append ? [...state.assets, ...response.data.assets] : response.data.assets,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        hasMore: response.data.hasMore,
        loading: false,
        source,
        tag,
      }));
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to fetch assets",
      });
    }
  },

  loadMore: async () => {
    const { hasMore, loading, page, source, tag, limit } = get();
    if (!hasMore || loading) {
      return;
    }

    await get().fetchAssets({
      page: page + 1,
      source,
      tag,
      limit,
      append: true,
    });
  },

  setSource: (source) => set({ source }),
  setTag: (tag) => set({ tag }),

  deleteAsset: async (id) => {
    await api.delete(`/media/assets/${id}`);
    set((state) => ({
      assets: state.assets.filter((asset) => asset.id !== id),
      total: Math.max(0, state.total - 1),
    }));
  },

  addTag: async (id, tag) => {
    const response = await api.patch<MediaAsset>(`/media/assets/${id}/tags`, {
      action: "add",
      tag,
    });

    set((state) => ({
      assets: state.assets.map((asset) => (asset.id === id ? response.data : asset)),
    }));
  },

  uploadAsset: async (file) => {
    const form = new FormData();
    form.append("file", file);

    set({ uploading: true, error: null });
    try {
      const response = await api.post<{ url: string; asset: MediaAsset }>("/media/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const asset = response.data.asset;
      set((state) => ({
        uploading: false,
        assets: [asset, ...state.assets],
        total: state.total + 1,
      }));
      return asset;
    } catch (error) {
      set({
        uploading: false,
        error: error instanceof Error ? error.message : "Failed to upload asset",
      });
      throw error;
    }
  },

  generateAsset: async (prompt) => {
    set({ uploading: true, error: null });
    try {
      const response = await api.post<{ url: string; asset: MediaAsset }>("/media/generate", { prompt });
      const asset = response.data.asset;
      set((state) => ({
        uploading: false,
        assets: [asset, ...state.assets],
        total: state.total + 1,
      }));
      return asset;
    } catch (error) {
      set({
        uploading: false,
        error: error instanceof Error ? error.message : "Failed to generate asset",
      });
      throw error;
    }
  },
}));
