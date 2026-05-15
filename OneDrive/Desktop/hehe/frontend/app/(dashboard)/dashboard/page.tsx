"use client";

import { Greeting } from "@/components/dashboard/Greeting";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AutopilotStrip } from "@/components/dashboard/AutopilotStrip";
import { HeroKpis } from "@/components/dashboard/HeroKpis";
import { PlatformHealthRow } from "@/components/dashboard/PlatformHealthRow";
import { EngagementChart } from "@/components/dashboard/EngagementChart";
import { SmartQueue } from "@/components/dashboard/SmartQueue";
import { AiInsights } from "@/components/dashboard/AiInsights";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { InboxPreview } from "@/components/dashboard/InboxPreview";
import { useDashboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function DashboardPage() {
  useDashboardShortcuts();

  return (
    <div className="h-full flex flex-col overflow-hidden px-4 md:px-5 pt-4 pb-2 gap-3">
      {/* Row 1 — Greeting + actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between shrink-0">
        <Greeting />
        <QuickActions />
      </div>

      {/* Row 2 — Autopilot */}
      <div className="shrink-0">
        <AutopilotStrip />
      </div>

      {/* Row 3 — KPI cards */}
      <div className="shrink-0">
        <HeroKpis />
      </div>

      {/* Row 4 — Platform health */}
      <div className="shrink-0">
        <PlatformHealthRow />
      </div>

      {/* Row 5 — Bottom grid: fills remaining height, scrolls internally */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-3 overflow-hidden">
        {/* Left 2/3 — stacked, inner scroll */}
        <div className="lg:col-span-2 flex flex-col gap-3 overflow-y-auto min-h-0 pr-0.5">
          <EngagementChart />
          <SmartQueue />
        </div>

        {/* Right 1/3 — stacked, inner scroll */}
        <div className="flex flex-col gap-3 overflow-y-auto min-h-0 pr-0.5">
          <AiInsights />
          <ActivityFeed />
          <InboxPreview />
        </div>
      </div>
    </div>
  );
}
