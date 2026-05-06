"use client";

import { create } from "zustand";
import type { View } from "react-big-calendar";
import type { Platform } from "@/components/platform-badge";

export interface CalendarPost {
  id: string;
  title: string;
  content: string;
  platforms: Platform[];
  status: string;
  scheduledAt: string;
}

interface CalendarState {
  selectedDate: string | null;
  viewMode: View;
  selectedPost: CalendarPost | null;
  setSelectedDate: (date: string | null) => void;
  setViewMode: (view: View) => void;
  setSelectedPost: (post: CalendarPost | null) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  selectedDate: null,
  viewMode: "month",
  selectedPost: null,
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSelectedPost: (selectedPost) => set({ selectedPost }),
}));
