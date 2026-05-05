"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export type Platform = "twitter" | "instagram" | "linkedin" | "facebook";

export interface Post {
  id: string;
  title: string;
  platform: Platform;
  status: "draft" | "scheduled" | "published";
  time: string;
  content: string;
  scheduledAt?: string;
}

interface PostsState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  fetchPosts: () => Promise<void>;
  createPost: (content: string, platforms: Platform[], scheduledAt?: string) => Promise<void>;
}

export const usePostsStore = create<PostsState>((set) => ({
  posts: [],
  loading: false,
  error: null,

  fetchPosts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<{
        posts: Array<{
          id: string;
          content: string;
          platforms: Array<{ platform: Platform }>;
          status: string;
          createdAt: string;
          scheduledAt?: string;
        }>;
      }>("/posts");

      const posts: Post[] = response.data.posts.flatMap((p) =>
        p.platforms.map((pm) => ({
          id: p.id,
          title: p.content.slice(0, 50) + (p.content.length > 50 ? "..." : ""),
          platform: pm.platform,
          status: p.status as "draft" | "scheduled" | "published",
          content: p.content,
          time:
            p.status === "scheduled" && p.scheduledAt
              ? new Date(p.scheduledAt).toLocaleString()
              : new Date(p.createdAt).toLocaleString(),
          scheduledAt: p.scheduledAt,
        }))
      );

      set({ posts, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch posts";
      set({ error: message, loading: false });
    }
  },

  createPost: async (content: string, platforms: Platform[], scheduledAt?: string) => {
    set({ loading: true, error: null });
    try {
      await api.post("/posts", {
        content,
        platforms,
        scheduledAt: scheduledAt || undefined,
      });
      // Refetch posts to update list with newly created post
      const response = await api.get<{
        posts: Array<{
          id: string;
          content: string;
          platforms: Array<{ platform: Platform }>;
          status: string;
          createdAt: string;
          scheduledAt?: string;
        }>;
      }>("/posts");

      const posts: Post[] = response.data.posts.flatMap((p) =>
        p.platforms.map((pm) => ({
          id: p.id,
          title: p.content.slice(0, 50) + (p.content.length > 50 ? "..." : ""),
          platform: pm.platform,
          status: p.status as "draft" | "scheduled" | "published",
          content: p.content,
          time:
            p.status === "scheduled" && p.scheduledAt
              ? new Date(p.scheduledAt).toLocaleString()
              : new Date(p.createdAt).toLocaleString(),
          scheduledAt: p.scheduledAt,
        }))
      );

      set({ posts, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create post";
      set({ error: message, loading: false });
      throw err;
    }
  },
}));
