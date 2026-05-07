"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, ShieldCheck, Zap } from "lucide-react";
import { api } from "@/lib/api";

interface BrandProfile {
  autonomousMode: boolean;
  approvalRequired: boolean;
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function AutomationSettingsPage() {
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<BrandProfile>("/brand/profile");
      setProfile(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function toggle(field: keyof BrandProfile, value: boolean) {
    if (!profile) return;
    setSaving(true);
    const prev = { ...profile };
    setProfile({ ...profile, [field]: value });
    try {
      await api.patch("/brand/profile", { [field]: value });
      setNotice("Saved");
      setTimeout(() => setNotice(null), 2000);
    } catch {
      setProfile(prev);
      setNotice("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!profile) return null;

  const isFullyAutonomous = profile.autonomousMode && !profile.approvalRequired;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="size-5 text-primary" />
          Automation
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Control how much your AI agent operates independently
        </p>
      </div>

      {notice && (
        <div className="text-sm px-3 py-2 rounded bg-muted text-muted-foreground">
          {notice}
        </div>
      )}

      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border text-sm">
        <div
          className={`size-2.5 rounded-full ${
            isFullyAutonomous
              ? "bg-green-500 animate-pulse"
              : profile.autonomousMode
                ? "bg-yellow-500"
                : "bg-muted-foreground"
          }`}
        />
        <span className="font-medium">
          {isFullyAutonomous
            ? "Fully Autonomous"
            : profile.autonomousMode
              ? "Semi-Autonomous"
              : "Manual Mode"}
        </span>
        <span className="ml-auto text-xs text-muted-foreground border border-border rounded px-2 py-0.5">
          {isFullyAutonomous
            ? "Agent runs hands-free"
            : profile.autonomousMode
              ? "Agent generates, you approve"
              : "You control everything"}
        </span>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Zap className="size-5 text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Autonomous Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Agent wakes up daily, scans trends, and schedules posts automatically
              </p>
            </div>
          </div>
          <Toggle
            checked={profile.autonomousMode}
            onChange={(v) => toggle("autonomousMode", v)}
            disabled={saving}
          />
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside pl-8">
          <li>Daily trend scan at 8am — top trends become draft posts</li>
          <li>Posts scheduled 24h ahead at your brand&apos;s peak time</li>
          <li>All runs logged in agent history</li>
        </ul>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="size-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Require Approval</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every agent-generated post lands in your Inbox before publishing
              </p>
            </div>
          </div>
          <Toggle
            checked={profile.approvalRequired}
            onChange={(v) => toggle("approvalRequired", v)}
            disabled={saving}
          />
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside pl-8">
          <li>Recommended when starting out — builds trust over time</li>
          <li>Turn off only after 2–4 weeks of reviewing agent output</li>
          {!profile.approvalRequired && profile.autonomousMode && (
            <li className="text-yellow-600 font-medium">
              Agent will publish without your review — monitor closely
            </li>
          )}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Recommended: enable Autonomous Mode first, keep Approval on.
        Turn off Approval only after validating output quality.
      </p>
    </div>
  );
}
