"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export interface BrandProfile {
  id: string;
  teamId: string;
  brandName: string;
  industry: string;
  description: string;
  voiceTone: string;
  voiceTraits: string[];
  formalityLevel: number;
  audienceAge: string;
  audienceGender: string;
  audienceLocation: string[];
  audienceInterests: string[];
  audiencePainPoints: string[];
  primaryGoal: string;
  secondaryGoals: string[];
  platforms: string[];
  postsPerWeek: Record<string, number>;
  contentMix: Record<string, number>;
  alwaysWords: string[];
  neverWords: string[];
  emojiUsage: string;
  hashtagStyle: string;
  autonomousMode: boolean;
  approvalRequired: boolean;
  onboardingComplete: boolean;
}

interface BrandState {
  profile: BrandProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  createProfile: (data: Partial<BrandProfile>) => Promise<BrandProfile>;
  updateProfile: (data: Partial<BrandProfile>) => Promise<BrandProfile>;
  completeOnboarding: () => Promise<void>;
}

export const useBrandStore = create<BrandState>()((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get("/brand/profile");
      set({ profile: data, loading: false });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        set({ profile: null, loading: false });
      } else {
        set({ error: err.message, loading: false });
      }
    }
  },

  createProfile: async (profileData) => {
    const { data } = await api.post("/brand/profile", profileData);
    set({ profile: data });
    return data;
  },

  updateProfile: async (profileData) => {
    const { data } = await api.patch("/brand/profile", profileData);
    set({ profile: data });
    return data;
  },

  completeOnboarding: async () => {
    const { data } = await api.post("/brand/profile/complete");
    set({ profile: data });
  },
}));
