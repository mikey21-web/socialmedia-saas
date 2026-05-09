"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { useOnboardingStore } from "@/store/onboarding";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Brain,
  PenTool,
  ImageIcon,
  BarChart3,
  MessageCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const AGENTS = [
  {
    name: "Strategist",
    desc: "Plans 30 days of content",
    icon: Brain,
    color: "bg-violet-100 text-violet-700",
  },
  {
    name: "Copywriter",
    desc: "Writes posts in your voice",
    icon: PenTool,
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Designer",
    desc: "Creates images and carousels",
    icon: ImageIcon,
    color: "bg-pink-100 text-pink-700",
  },
  {
    name: "Analyst",
    desc: "Tracks performance daily",
    icon: BarChart3,
    color: "bg-green-100 text-green-700",
  },
  {
    name: "Engagement",
    desc: "Replies to comments",
    icon: MessageCircle,
    color: "bg-amber-100 text-amber-700",
  },
];

const TIMELINE = [
  { label: "Now", desc: "Your AI generates this week's content" },
  { label: "Tonight", desc: "First posts ready for review" },
  { label: "Tomorrow", desc: "Publishing begins" },
  { label: "Day 7", desc: "First analytics report" },
];

export default function Step10() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [activating, setActivating] = useState(false);
  const [dots, setDots] = useState(0);
  const [done, setDone] = useState(false);

  const profile = store.extractedProfile;
  const emojis = profile?.emojiPatterns?.preferred ?? [];
  const emojiFreq =
    emojis.length > 0
      ? profile!.emojiPatterns!.frequency > 0.6
        ? "heavy"
        : profile!.emojiPatterns!.frequency > 0.3
        ? "moderate"
        : "sparse"
      : "none";

  const handleActivate = async () => {
    setActivating(true);
    const interval = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    try {
      await api.post("/onboarding/complete");
      clearInterval(interval);
      setDone(true);
      setTimeout(() => router.replace("/agency"), 1500);
    } catch {
      clearInterval(interval);
      setActivating(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-6">
        <ProgressBar currentStep={10} />
        <Card className="p-12 flex flex-col items-center justify-center space-y-4">
          <div className="size-16 rounded-full bg-green-100 flex items-center justify-center animate-pulse">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">AI Agency Activated!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Redirecting to your dashboard...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={10} />
      <Card className="p-6 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">You&apos;re ready. Here&apos;s your AI team.</h1>
          <p className="text-sm text-muted-foreground mt-1">
            5 AI agents, working together for your brand.
          </p>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {AGENTS.map(({ name, desc, icon: Icon, color }) => (
            <div
              key={name}
              className="flex flex-col items-center text-center p-3 rounded-lg border border-border"
            >
              <div className={cn("size-10 rounded-full flex items-center justify-center mb-2", color)}>
                <Icon className="size-5" />
              </div>
              <p className="text-xs font-semibold">{name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                {desc}
              </p>
              <div className="mt-2 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
                Ready
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            <p className="text-xs font-semibold text-muted-foreground">SETUP SUMMARY</p>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vertical</span>
                <span className="font-medium">
                  {store.vertical?.replace(/-/g, " ") || "—"} {store.businessName && `(${store.businessName})`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platforms</span>
                <span className="font-medium">
                  {store.connectedAccounts.length > 0
                    ? store.connectedAccounts.join(", ")
                    : "None connected yet"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Posting</span>
                <span className="font-medium">
                  {store.postingFrequency} at{" "}
                  {store.postingTimes.join(", ")} ({store.timezone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium">
                  {store.autonomousMode ? "Auto-publish" : "Review required"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-xs font-semibold text-muted-foreground">BRAND IDENTITY</p>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Brand voice</span>
                <span className="font-medium capitalize">
                  {profile ? "custom" : "default"} style, {emojiFreq} emoji
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Colors</span>
                <div className="flex gap-1">
                  {Object.values(store.brandColors).map((c, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-sm border border-border"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Font</span>
                <span className="font-medium">{store.fontPrimary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI Learning</span>
                <span className="font-medium">
                  {store.sampleCount} writing samples analyzed
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">What happens next</p>
          <div className="space-y-2">
            {TIMELINE.map(({ label, desc }) => (
              <div key={label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  {label !== "Day 7" && (
                    <div className="w-px flex-1 bg-border min-h-4" />
                  )}
                </div>
                <div className="pb-3">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleActivate}
            disabled={activating}
            className="w-full h-12 text-base font-semibold"
          >
            {activating ? (
              <>
                <Loader2 className="size-5 mr-2 animate-spin" />
                Activating your AI team
                {".".repeat(dots)}
              </>
            ) : (
              "Activate My AI Agency"
            )}
          </Button>
          <div className="text-center">
            <button
              onClick={() => router.replace("/agency")}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Finish setup later
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
