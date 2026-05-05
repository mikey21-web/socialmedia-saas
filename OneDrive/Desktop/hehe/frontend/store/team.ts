"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export interface TeamMember {
  userId: string;
  email: string;
  role: string;
}

export interface TeamData {
  id: string;
  name: string;
  members: TeamMember[];
}

interface TeamState {
  team: TeamData | null;
  loading: boolean;
  error: string | null;
  fetchTeam: (teamId: string) => Promise<void>;
  addMember: (teamId: string, email: string) => Promise<void>;
  removeMember: (teamId: string, userId: string) => Promise<void>;
}

export const useTeamsStore = create<TeamState>((set) => ({
  team: null,
  loading: false,
  error: null,

  fetchTeam: async (teamId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<TeamData>(`/teams/${teamId}`);
      set({ team: response.data, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch team";
      set({ loading: false, error: message });
    }
  },

  addMember: async (teamId: string, email: string) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/teams/${teamId}/members`, { email });
      const response = await api.get<TeamData>(`/teams/${teamId}`);
      set({ team: response.data, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to invite member";
      set({ loading: false, error: message });
      throw err;
    }
  },

  removeMember: async (teamId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`);
      const response = await api.get<TeamData>(`/teams/${teamId}`);
      set({ team: response.data, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove member";
      set({ loading: false, error: message });
      throw err;
    }
  },
}));
