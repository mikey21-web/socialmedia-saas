"use client";

import { create } from "zustand";

export interface ToneDimensions {
  formality: number;
  playfulness: number;
  warmth: number;
  urgency: number;
  technicality: number;
  authority: number;
  vulnerability: number;
  humor: number;
  directness: number;
  inspiration: number;
}

export interface VocabularyBank {
  commonWords: string[];
  avoidWords: string[];
  industryTerms: string[];
}

export interface EmojiPatterns {
  frequency: number;
  preferred: string[];
  avoidEmojis: string[];
}

export interface HashtagStyle {
  placement: "start" | "middle" | "end";
  count: number;
  format: "lowercase" | "camelcase" | "uppercase";
}

export interface BrandColorPalette {
  brandPrimary: string;
  brandLight: string;
  brandDark: string;
  lightBg: string;
  lightBorder: string;
  darkBg: string;
}

export interface ExtractedProfile {
  toneDimensions: ToneDimensions;
  vocabularyBank: VocabularyBank;
  emojiPatterns: EmojiPatterns;
  hashtagStyle: HashtagStyle;
  sampleCount: number;
}

interface OnboardingStore {
  businessName: string;
  vertical: string;
  language: string;
  city: string;
  platform: string;
  connectedAccounts: string[];
  audienceAge: string;
  audienceGender: string;
  audienceLocation: string[];
  audienceInterests: string[];
  primaryGoal: string;
  followerGoal: number;
  brandVoiceSamples: string[];
  extractedProfile: ExtractedProfile | null;
  profileId: string | null;
  isExtracting: boolean;
  brandColors: BrandColorPalette;
  fontPrimary: string;
  fontSecondary: string;
  postingFrequency: string;
  postingTimes: string[];
  timezone: string;
  autonomousMode: boolean;
  notificationPhone: string;
  notificationEmail: string;
  sampleCount: number;

  setBusinessInfo: (data: { businessName?: string; vertical?: string; language?: string; city?: string }) => void;
  setPlatform: (platform: string) => void;
  setConnectedAccounts: (accounts: string[]) => void;
  setAudience: (data: { audienceAge?: string; audienceGender?: string; audienceLocation?: string[]; audienceInterests?: string[] }) => void;
  setGoals: (data: { primaryGoal?: string; followerGoal?: number }) => void;
  setBrandVoiceSamples: (samples: string[]) => void;
  setExtractedProfile: (profile: ExtractedProfile | null) => void;
  setProfileId: (id: string | null) => void;
  setIsExtracting: (v: boolean) => void;
  setBrandColors: (colors: Partial<BrandColorPalette>) => void;
  setFonts: (fontPrimary: string, fontSecondary: string) => void;
  setSchedule: (data: { frequency?: string; times?: string[]; timezone?: string; autonomousMode?: boolean; notificationPhone?: string; notificationEmail?: string }) => void;
  setSampleCount: (count: number) => void;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 210, s: 0.65, l: 0.5 };
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const toHex = (c: number) => {
    const hex = Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return "#" + toHex(hue2rgb(p, q, h / 360 + 1 / 3)) + toHex(hue2rgb(p, q, h / 360)) + toHex(hue2rgb(p, q, h / 360 - 1 / 3));
}

export function derivePalette(primaryHex: string): BrandColorPalette {
  const hsl = hexToHsl(primaryHex);
  return {
    brandPrimary: primaryHex,
    brandLight: hslToHex(hsl.h, hsl.s * 0.8, Math.min(hsl.l + 15, 95)),
    brandDark: hslToHex(hsl.h, hsl.s, hsl.l * 0.7),
    lightBg: hslToHex(hsl.h, 8, 97),
    lightBorder: hslToHex(hsl.h, 12, 92),
    darkBg: hslToHex(hsl.h, 15, 8),
  };
}

export const useOnboardingStore = create<OnboardingStore>()((set) => ({
  businessName: "",
  vertical: "",
  language: "en",
  city: "",
  platform: "",
  connectedAccounts: [],
  audienceAge: "25-34",
  audienceGender: "all",
  audienceLocation: [],
  audienceInterests: [],
  primaryGoal: "leads",
  followerGoal: 1000,
  brandVoiceSamples: [],
  extractedProfile: null,
  profileId: null,
  isExtracting: false,
  brandColors: derivePalette("#6366f1"),
  fontPrimary: "Inter",
  fontSecondary: "Inter",
  postingFrequency: "daily",
  postingTimes: ["10:00", "18:00"],
  timezone: "Asia/Kolkata",
  autonomousMode: true,
  notificationPhone: "",
  notificationEmail: "",
  sampleCount: 0,

  setBusinessInfo: (data) => set((s) => ({ ...s, ...data })),
  setPlatform: (platform) => set({ platform }),
  setConnectedAccounts: (accounts) => set({ connectedAccounts: accounts }),
  setAudience: (data) => set((s) => ({ ...s, ...data })),
  setGoals: (data) => set((s) => ({ ...s, ...data })),
  setBrandVoiceSamples: (samples) => set({ brandVoiceSamples: samples }),
  setExtractedProfile: (profile) => set({ extractedProfile: profile }),
  setProfileId: (id) => set({ profileId: id }),
  setIsExtracting: (v) => set({ isExtracting: v }),
  setBrandColors: (colors) => set((s) => ({ brandColors: { ...s.brandColors, ...colors } })),
  setFonts: (fontPrimary, fontSecondary) => set({ fontPrimary, fontSecondary }),
  setSchedule: (data) => set((s) => ({ ...s, ...data })),
  setSampleCount: (count) => set({ sampleCount: count }),
}));
