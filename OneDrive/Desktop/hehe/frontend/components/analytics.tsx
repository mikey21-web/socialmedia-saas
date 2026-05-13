"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Analytics component — wires PostHog + Crisp live chat.
 *
 * Environment variables needed:
 *   NEXT_PUBLIC_POSTHOG_KEY     — PostHog project API key
 *   NEXT_PUBLIC_POSTHOG_HOST    — PostHog host (default: https://app.posthog.com)
 *   NEXT_PUBLIC_CRISP_WEBSITE_ID — Crisp website ID
 *   NEXT_PUBLIC_GA_MEASUREMENT_ID — Google Analytics 4 measurement ID (optional)
 *
 * All analytics are no-ops when the env vars are not set, so dev/test
 * environments work without any configuration.
 */

declare global {
  interface Window {
    posthog?: {
      init: (key: string, options: Record<string, unknown>) => void;
      capture: (event: string, properties?: Record<string, unknown>) => void;
      identify: (id: string, properties?: Record<string, unknown>) => void;
      reset: () => void;
      page: () => void;
    };
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === "undefined") return;

  // Dynamically import posthog-js only if installed
  // Install with: npm install posthog-js
  import("posthog-js" as any).then((mod: any) => {
    const posthog = mod.default;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,
      persistence: "localStorage",
    });
    window.posthog = posthog;
  }).catch(() => {
    // posthog-js not installed — skip silently
  });
}

function initCrisp() {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
  if (!websiteId || typeof window === "undefined") return;

  window.$crisp = [];
  window.CRISP_WEBSITE_ID = websiteId;

  const script = document.createElement("script");
  script.src = "https://client.crisp.chat/l.js";
  script.async = true;
  document.head.appendChild(script);
}

function initGA() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId || typeof window === "undefined") return;

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });
}

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize on mount
  useEffect(() => {
    initPostHog();
    initCrisp();
    initGA();
  }, []);

  // Track page views on route change
  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

    // PostHog
    if (window.posthog) {
      window.posthog.capture("$pageview", { $current_url: url });
    }

    // GA4
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (window.gtag && measurementId) {
      window.gtag("config", measurementId, { page_path: url });
    }
  }, [pathname, searchParams]);

  return null;
}

/**
 * Track a custom event. Call this from anywhere in the app.
 *
 * Examples:
 *   trackEvent("post_created", { platform: "instagram" })
 *   trackEvent("onboarding_completed", { step: 10 })
 *   trackEvent("upgrade_clicked", { from_plan: "free", to_plan: "pro" })
 */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  // PostHog
  if (window.posthog) {
    window.posthog.capture(event, properties);
  }

  // GA4
  if (window.gtag) {
    window.gtag("event", event, properties);
  }
}

/**
 * Identify the current user. Call after login/signup.
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  if (window.posthog) {
    window.posthog.identify(userId, properties);
  }
}

/**
 * Reset analytics on logout.
 */
export function resetAnalytics() {
  if (typeof window === "undefined") return;

  if (window.posthog) {
    window.posthog.reset();
  }
}
