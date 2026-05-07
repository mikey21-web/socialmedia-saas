"use client";

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { PostCalendarItem } from '@/lib/calendar';

interface CalendarState {
  currentDate: Date;
  posts: PostCalendarItem[];
  loading: boolean;
  selectedDate: string | null;
  selectedPost: PostCalendarItem | null;
  setMonth: (date: Date) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  fetchPosts: () => Promise<void>;
  reschedulePost: (postId: string, newDate: Date) => Promise<void>;
  selectDate: (dateStr: string | null) => void;
  selectPost: (post: PostCalendarItem | null) => void;
}

function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);
  return { start, end };
}

function toISODateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentDate: new Date(),
  posts: [],
  loading: false,
  selectedDate: null,
  selectedPost: null,

  setMonth: (date: Date) => {
    set({ currentDate: date });
    get().fetchPosts();
  },

  nextMonth: () => {
    const newDate = new Date(get().currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    set({ currentDate: newDate });
    get().fetchPosts();
  },

  prevMonth: () => {
    const newDate = new Date(get().currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    set({ currentDate: newDate });
    get().fetchPosts();
  },

  fetchPosts: async () => {
    set({ loading: true });
    try {
      const { start, end } = getMonthRange(get().currentDate);
      const response = await api.get<{
        posts: Array<{
          id: string;
          title: string;
          status: string;
          scheduledAt: string | null;
          platforms: Array<{ platform: string }>;
        }>;
      }>('/posts', {
        params: {
          startDate: toISODateStr(start),
          endDate: toISODateStr(end),
          limit: 500,
        },
      });

      const posts: PostCalendarItem[] = response.data.posts
        .filter(post => post.scheduledAt)
        .map(post => ({
          id: post.id,
          title: post.title,
          status: post.status as PostCalendarItem['status'],
          scheduledAt: post.scheduledAt,
          platforms: post.platforms.map(p => p.platform),
        }));

      set({ posts, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  reschedulePost: async (postId: string, newDate: Date) => {
    await api.patch(`/posts/${postId}`, {
      scheduledAt: newDate.toISOString(),
    });
    await get().fetchPosts();
  },

  selectDate: (dateStr: string | null) => {
    set({ selectedDate: dateStr });
  },

  selectPost: (post: PostCalendarItem | null) => {
    set({ selectedPost: post });
  },
}));