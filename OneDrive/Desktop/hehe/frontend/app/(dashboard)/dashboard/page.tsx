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
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Greeting />
        <QuickActions />
      </div>

      <AutopilotStrip />
      <HeroKpis />
      <PlatformHealthRow />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <EngagementChart />
          <SmartQueue />
        </div>
        <div className="space-y-4">
          <AiInsights />
          <ActivityFeed />
          <InboxPreview />
        </div>
      </div>
    </div>
  );
}
