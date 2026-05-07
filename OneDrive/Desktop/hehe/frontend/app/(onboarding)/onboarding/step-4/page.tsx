"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { PillarsBuilder, type Pillar } from "@/components/onboarding/PillarsBuilder";
import { useBrandStore } from "@/store/brand";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const GOAL_OPTIONS = ["awareness", "leads", "sales", "community"];
const PLATFORM_OPTIONS = ["instagram", "linkedin", "twitter", "facebook", "tiktok", "youtube"];
const CONTENT_MIX_KEYS = ["educational", "entertaining", "promotional", "ugc"] as const;

export default function Step4() {
  const router = useRouter();
  const profile = useBrandStore((s) => s.profile);
  const updateProfile = useBrandStore((s) => s.updateProfile);
  const fetchProfile = useBrandStore((s) => s.fetchProfile);

  const [primaryGoal, setPrimaryGoal] = useState("awareness");
  const [secondaryGoals, setSecondaryGoals] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [postsPerWeek, setPostsPerWeek] = useState<Record<string, number>>({});
  const [contentMix, setContentMix] = useState<Record<string, number>>({ educational: 40, entertaining: 30, promotional: 20, ugc: 10 });
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setPrimaryGoal(profile.primaryGoal || "awareness");
      setSecondaryGoals(profile.secondaryGoals || []);
      setPlatforms(profile.platforms || []);
      setPostsPerWeek(profile.postsPerWeek || {});
      setContentMix(profile.contentMix && Object.keys(profile.contentMix).length > 0
        ? profile.contentMix
        : { educational: 40, entertaining: 30, promotional: 20, ugc: 10 });
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      api.get("/brand/pillars").then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setPillars(data.map((p: any) => ({ name: p.name, description: p.description, weight: p.weight })));
        }
      }).catch(() => {});
    }
  }, [profile]);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const toggleSecondary = (g: string) => {
    if (g === primaryGoal) return;
    setSecondaryGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  };

  const setMixValue = (key: string, val: number) => {
    setContentMix((prev) => ({ ...prev, [key]: val }));
  };

  const mixTotal = Object.values(contentMix).reduce((a, b) => a + b, 0);

  const handleNext = async () => {
    setSaving(true);
    try {
      await updateProfile({ primaryGoal, secondaryGoals, platforms, postsPerWeek, contentMix });

      for (const pillar of pillars) {
        await api.post("/brand/pillars", pillar);
      }

      router.push("/onboarding/step-5");
    } finally { setSaving(false); }
  };

  const handleSkip = () => router.push("/onboarding/step-5");

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={4} />
      <Card className="p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold">Strategy</h1>
          <p className="text-sm text-muted-foreground mt-1">Define your goals and posting plan.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Primary Goal</Label>
            <Select value={primaryGoal} onValueChange={(v) => v !== null && setPrimaryGoal(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map((g) => (
                  <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Secondary Goals</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.filter((g) => g !== primaryGoal).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleSecondary(g)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    secondaryGoals.includes(g)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-ring"
                  )}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    platforms.includes(p)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-ring"
                  )}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {platforms.length > 0 && (
            <div className="space-y-2">
              <Label>Posts per week</Label>
              {platforms.map((p) => (
                <div key={p} className="flex items-center gap-3">
                  <span className="text-xs w-20 shrink-0 capitalize">{p}</span>
                  <input
                    type="range"
                    min={1}
                    max={14}
                    value={postsPerWeek[p] ?? 3}
                    onChange={(e) => setPostsPerWeek((prev) => ({ ...prev, [p]: Number(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-xs w-6 text-right font-medium">{postsPerWeek[p] ?? 3}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>Content Mix {mixTotal !== 100 && <span className="text-destructive text-xs ml-1">(total: {mixTotal}%, should be 100%)</span>}</Label>
            {CONTENT_MIX_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs w-24 shrink-0 capitalize">{key}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={contentMix[key] ?? 25}
                  onChange={(e) => setMixValue(key, Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right font-medium">{contentMix[key] ?? 25}%</span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Content Pillars</Label>
            <p className="text-xs text-muted-foreground">Add 3-5 pillars that define your content categories.</p>
            <PillarsBuilder value={pillars} onChange={setPillars} />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/onboarding/step-3")}>Back</Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip}>Skip for now</Button>
            <Button onClick={handleNext} disabled={saving}>{saving ? "Saving..." : "Next"}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
