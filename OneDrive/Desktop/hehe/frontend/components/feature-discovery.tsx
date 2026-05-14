"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BarChart2,
  Brain,
  FileImage,
  Film,
  Sparkles,
  TrendingUp,
  Users,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Feature Discovery System
 *
 * Shows contextual banners that introduce features at the right moment.
 * Rules:
 * - Only show one banner at a time
 * - Dismiss persists to localStorage
 * - Each banner shows max 3 times before auto-dismissing
 * - Banners are contextual (show on relevant pages)
 */

interface DiscoveryBanner {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: React.ElementType;
  color: string;
  showOn: string[];        // pathname prefixes where this shows
  showAfterDays: number;   // days after signup before showing
  requiresCondition?: string; // optional condition key
}

const BANNERS: DiscoveryBanner[] = [
  {
    id: "discover-carousel",
    title: "Generate branded carousels",
    description: "Turn any topic into a 7-slide Instagram carousel in 30 seconds. Your brand colors, your voice.",
    cta: "Try Carousel Studio",
    href: "/carousel",
    icon: FileImage,
    color: "from-purple-500/10 to-fuchsia-500/10 border-purple-500/20",
    showOn: ["/posts", "/dashboard"],
    showAfterDays: 1,
  },
  {
    id: "discover-roi",
    title: "Track which posts drive revenue",
    description: "Every post gets a UTM link. See clicks → conversions → revenue. Not just vanity metrics.",
    cta: "View ROI Dashboard",
    href: "/analytics/roi",
    icon: BarChart2,
    color: "from-emerald-500/10 to-green-500/10 border-emerald-500/20",
    showOn: ["/analytics", "/dashboard"],
    showAfterDays: 3,
  },
  {
    id: "discover-competitors",
    title: "See what your competitors are posting",
    description: "We monitor their accounts and auto-draft counter-posts in your voice when they post something good.",
    cta: "View Competitor Intel",
    href: "/competitors",
    icon: Users,
    color: "from-blue-500/10 to-cyan-500/10 border-blue-500/20",
    showOn: ["/dashboard", "/posts"],
    showAfterDays: 3,
  },
  {
    id: "discover-insights",
    title: "Your AI is learning what works",
    description: "After 30 days, we detect patterns: which hooks, times, and formats get you the most engagement.",
    cta: "View Insights",
    href: "/analytics/insights",
    icon: Brain,
    color: "from-amber-500/10 to-orange-500/10 border-amber-500/20",
    showOn: ["/analytics", "/dashboard"],
    showAfterDays: 7,
  },
  {
    id: "discover-video",
    title: "Turn clips into platform-native videos",
    description: "Upload a 30s clip → auto-format for Reels, TikTok, LinkedIn, X. Captions + hooks included.",
    cta: "Try Video Studio",
    href: "/video",
    icon: Film,
    color: "from-pink-500/10 to-rose-500/10 border-pink-500/20",
    showOn: ["/media", "/posts", "/dashboard"],
    showAfterDays: 5,
  },
  {
    id: "discover-hyperframes",
    title: "Create animated videos from templates",
    description: "15 templates: money counters, product reveals, brand sizzle reels. Fill fields, get MP4.",
    cta: "Browse Templates",
    href: "/hyperframes",
    icon: Wand2,
    color: "from-violet-500/10 to-purple-500/10 border-violet-500/20",
    showOn: ["/carousel", "/media", "/video"],
    showAfterDays: 7,
  },
  {
    id: "discover-office",
    title: "Watch your AI team collaborate",
    description: "The Office shows your 5 AI agents working together in real-time. See their decisions and conversations.",
    cta: "Visit The Office",
    href: "/agency/office",
    icon: Zap,
    color: "from-yellow-500/10 to-amber-500/10 border-yellow-500/20",
    showOn: ["/agency", "/dashboard"],
    showAfterDays: 2,
  },
  {
    id: "discover-multilingual",
    title: "Generate in Hindi, Tamil, Telugu & more",
    description: "Your AI can write in 8 Indian languages with natural code-switching. Reach your full audience.",
    cta: "Try Multilingual",
    href: "/chat",
    icon: Sparkles,
    color: "from-indigo-500/10 to-blue-500/10 border-indigo-500/20",
    showOn: ["/posts", "/dashboard"],
    showAfterDays: 5,
  },
  {
    id: "discover-reels",
    title: "Don't know what to film for Reels?",
    description: "Pick a proven format, tell us your topic, get a full shot list + script + hashtags in 10 seconds.",
    cta: "Open Reel Studio",
    href: "/reels",
    icon: Film,
    color: "from-violet-500/10 to-fuchsia-500/10 border-violet-500/20",
    showOn: ["/dashboard", "/posts", "/video", "/media"],
    showAfterDays: 2,
  },
];

const MAX_SHOWS = 3;
const STORAGE_KEY = "feature_discovery";

interface DiscoveryState {
  dismissed: string[];
  showCounts: Record<string, number>;
  signupDate: string;
}

function getState(): DiscoveryState {
  if (typeof window === "undefined") return { dismissed: [], showCounts: {}, signupDate: new Date().toISOString() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const state = { dismissed: [], showCounts: {}, signupDate: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function saveState(state: DiscoveryState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function FeatureDiscoveryBanner() {
  const pathname = usePathname();
  const [banner, setBanner] = useState<DiscoveryBanner | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const state = getState();
    const daysSinceSignup = (Date.now() - new Date(state.signupDate).getTime()) / (1000 * 60 * 60 * 24);

    // Find the first eligible banner for this page
    const eligible = BANNERS.find((b) => {
      if (state.dismissed.includes(b.id)) return false;
      if ((state.showCounts[b.id] ?? 0) >= MAX_SHOWS) return false;
      if (daysSinceSignup < b.showAfterDays) return false;
      if (!b.showOn.some((prefix) => pathname.startsWith(prefix))) return false;
      return true;
    });

    if (eligible) {
      setBanner(eligible);
      // Increment show count
      state.showCounts[eligible.id] = (state.showCounts[eligible.id] ?? 0) + 1;
      saveState(state);
      // Delay showing for smooth UX
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setBanner(null);
      setVisible(false);
    }
  }, [pathname]);

  function dismiss() {
    if (!banner) return;
    const state = getState();
    state.dismissed.push(banner.id);
    saveState(state);
    setVisible(false);
    setTimeout(() => setBanner(null), 300);
  }

  if (!banner || !visible) return null;

  const Icon = banner.icon;

  return (
    <div
      className={cn(
        "mx-4 mt-4 p-4 rounded-xl border bg-gradient-to-r transition-all duration-300",
        banner.color,
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-lg bg-background/80 flex items-center justify-center shrink-0">
          <Icon className="size-4 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{banner.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{banner.description}</p>
          <Link href={banner.href} onClick={dismiss}>
            <Button size="sm" variant="ghost" className="mt-2 h-7 px-3 text-xs gap-1 -ml-3">
              {banner.cta} <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground p-1 shrink-0"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
