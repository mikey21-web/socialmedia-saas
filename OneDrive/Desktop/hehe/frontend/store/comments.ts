"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export interface Author {
  id: string;
  name: string | null;
  email: string;
}

export interface CommentItem {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentCommentId: string | null;
  createdAt: string;
  author: Author;
  replies: CommentItem[];
}

interface CommentsState {
  comments: CommentItem[];
  loading: boolean;
  error: string | null;
  fetchComments: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string, parentCommentId?: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  comments: [],
  loading: false,
  error: null,

  fetchComments: async (postId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<CommentItem[]>(`/posts/${postId}/comments`);
      set({ comments: response.data, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch comments",
      });
    }
  },

  addComment: async (postId: string, content: string, parentCommentId?: string) => {
    await api.post(`/posts/${postId}/comments`, { content, parentCommentId });
    await get().fetchComments(postId);
  },

  deleteComment: async (postId: string, commentId: string) => {
    await api.delete(`/posts/${postId}/comments/${commentId}`);
    await get().fetchComments(postId);
  },
}));