"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { Input } from "@/components/ui/input";
import { useOnboardingStore } from "@/store/onboarding";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const TIME_SLOTS: Record<string, string[]> = {
  salon: ["09:00", "18:00"],
  "beauty-parlor": ["09:00", "18:00"],
  restaurant: ["11:00", "19:00"],
  food: ["11:00", "19:00"],
  "real-estate": ["10:00", "17:00"],
  gym: ["07:00", "18:00"],
  yoga: ["07:00", "18:00"],
  coaching: ["09:00", "20:00"],
  coach: ["09:00", "20:00"],
  consultant: ["09:00", "20:00"],
};

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { value: "US/Eastern", label: "US/Eastern (ET)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "US/Pacific", label: "US/Pacific (PT)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET)" },
];

const HOURS = Array.from({ length: 34 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
});

const FREQUENCIES = [
  { id: "daily", label: "Daily", desc: "30 posts/month. Maximum visibility.", recommended: true },
  { id: "3x", label: "3x per week", desc: "12 posts/month. Steady growth.", recommended: false },
  { id: "2x", label: "2x per week", desc: "8 posts/month. Low effort.", recommended: false },
  { id: "custom", label: "Custom", desc: "I'll set exact days", recommended: false },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Step9() {
  const router = useRouter();
  const store = useOnboardingStore();
  const vertical = store.vertical?.toLowerCase() ?? "";

  const defaultTimes = Object.entries(TIME_SLOTS).find(([key]) =>
    vertical.includes(key)
  )?.[1] ?? ["10:00", "18:00"];

  const [frequency, setFrequency] = useState(store.postingFrequency);
  const [times, setTimes] = useState<string[]>(
    store.postingTimes.length > 0 ? store.postingTimes : defaultTimes
  );
  const [timezone, setTimezone] = useState(store.timezone);
  const [autonomousMode, setAutonomousMode] = useState(store.autonomousMode);
  const [notifPhone, setNotifPhone] = useState(store.notificationPhone);
  const [notifEmail, setNotifEmail] = useState(store.notificationEmail);
  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: number) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addTime = () => {
    if (times.length < 4) setTimes([...times, "12:00"]);
  };

  const removeTime = (idx: number) => {
    setTimes(times.filter((_, i) => i !== idx));
  };

  const updateTime = (idx: number, val: string) => {
    setTimes(times.map((t, i) => (i === idx ? val : t)));
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      store.setSchedule({
        frequency,
        times,
        timezone,
        autonomousMode,
        notificationPhone: notifPhone,
        notificationEmail: notifEmail,
      });

      try {
        await api.patch("/agency/orchestrator/schedule", {
          frequency,
          times,
          timezone,
          autonomousMode,
          notificationPhone: notifPhone,
        });
      } catch {
        // schedule endpoint may not exist yet
      }

      router.push("/onboarding/step-10");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={9} />
      <Card className="p-6 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">When should your AI post?</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your AI will publish autonomously on this schedule.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Posting Frequency</h2>
          <div className="grid grid-cols-2 gap-3">
            {FREQUENCIES.map(({ id, label, desc, recommended }) => (
              <button
                key={id}
                onClick={() => setFrequency(id)}
                className={cn(
                  "p-3 rounded-lg border-2 text-left transition-colors relative",
                  frequency === id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-ring"
                )}
              >
                {recommended && (
                  <Badge className="absolute -top-2 right-2 text-[10px] h-4">
                    Recommended
                  </Badge>
                )}
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          {frequency === "custom" && (
            <div className="flex gap-2 flex-wrap">
              {WEEKDAYS.map((day, i) => (
                <button
                  key={day}
                  onClick={() => toggleDay(i + 1)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs border transition-colors",
                    activeDays.includes(i + 1)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-ring"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Posting Times</h2>
          <p className="text-xs text-muted-foreground">
            Best times for your vertical pre-filled below.
          </p>
          <div className="space-y-2">
            {times.map((t, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select
                  value={t}
                  onChange={(e) => updateTime(i, e.target.value)}
                  className="h-9 px-3 text-sm rounded-md border border-input bg-background"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                {times.length > 1 && (
                  <button
                    onClick={() => removeTime(i)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {times.length < 4 && (
              <Button variant="outline" size="sm" onClick={addTime}>
                Add another time
              </Button>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Timezone</h2>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background"
          >
            {TIMEZONES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Autonomous Mode</h2>
          <div className="space-y-2">
            <button
              onClick={() => setAutonomousMode(true)}
              className={cn(
                "w-full p-3 rounded-lg border-2 text-left transition-colors",
                autonomousMode
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-ring"
              )}
            >
              <p className="text-sm font-medium">Auto-publish without review</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your AI publishes directly to your channels.
              </p>
            </button>
            <button
              onClick={() => setAutonomousMode(false)}
              className={cn(
                "w-full p-3 rounded-lg border-2 text-left transition-colors",
                !autonomousMode
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-ring"
              )}
            >
              <p className="text-sm font-medium">Review before publishing</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You get a daily digest to approve before anything goes live.
              </p>
            </button>
          </div>

          {!autonomousMode && (
            <div className="space-y-2 pl-2 border-l-2 border-primary/20">
              <p className="text-xs text-muted-foreground">Notify me how?</p>
              <div className="flex gap-2">
                <Input
                  value={notifPhone}
                  onChange={(e) => setNotifPhone(e.target.value)}
                  placeholder="WhatsApp number (optional)"
                  className="h-8 text-sm"
                />
                <Input
                  value={notifEmail}
                  onChange={(e) => setNotifEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}
        </section>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/onboarding/step-8")}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={saving}>
            {saving ? "Saving..." : "Next"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
