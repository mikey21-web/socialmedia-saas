"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useBrandStore } from "@/store/brand";

function isBoneyardBuild() {
  return process.env.NODE_ENV !== 'production' && typeof window !== "undefined" && Boolean((window as Window & { __BONEYARD_BUILD?: boolean }).__BONEYARD_BUILD);
}

function isDemoMode(token: string | null) {
  return token === "demo-preview-token";
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const profile = useBrandStore((s) => s.profile);
  const fetchProfile = useBrandStore((s) => s.fetchProfile);
  const loading = useBrandStore((s) => s.loading);
  const [hydrated, setHydrated] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (isBoneyardBuild() || isDemoMode(token)) return;
    if (!token) {
      router.replace("/signin");
    }
  }, [token, router, hydrated]);

  useEffect(() => {
    if (isBoneyardBuild() || isDemoMode(token)) {
      setProfileChecked(true);
      return;
    }
    if (hydrated && token && !profileChecked) {
      fetchProfile().finally(() => setProfileChecked(true));
    }
  }, [hydrated, token, profileChecked, fetchProfile]);

  useEffect(() => {
    if (!hydrated || !token || !profileChecked || loading) return;
    if (isBoneyardBuild() || isDemoMode(token)) return;
    const isOnboarding = pathname.startsWith("/onboarding");
    const localOnboardingComplete = localStorage.getItem("onboardingComplete") === "true";

    if (!isOnboarding && !localOnboardingComplete && (!profile || !profile.onboardingComplete)) {
      router.replace("/onboarding");
    }
  }, [hydrated, token, profileChecked, loading, profile, pathname, router]);

  if (isBoneyardBuild() || isDemoMode(token)) return <>{children}</>;
  if (!hydrated || !token) return null;
  if (!profileChecked || loading) return null;
  return <>{children}</>;
}
