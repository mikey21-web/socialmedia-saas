"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  setToken: (token: string) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      setToken: (token) => set({ token }),
      setTokens: ({ accessToken, refreshToken }) => set({ token: accessToken, refreshToken }),
      clearToken: () => set({ token: null, refreshToken: null }),
    }),
    { name: "auth" }
  )
);
