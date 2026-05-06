"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Download, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalyticsStore } from "@/store/analytics";
import { cn } from "@/lib/utils";

const RANGES = ["7d", "30d", "90d"] as const;
type Range = (typeof RANGES)[number];

const TOOLTIP_STYLE = {
  background: "#1c1c1c",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
};

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("30d");
  const metrics = useAnalyticsStore((s) => s.metrics);
  const chartData = useAnalyticsStore((s) => s.chartData);
  const platformStats = useAnalyticsStore((s) => s.platformStats);
  const loading = useAnalyticsStore((s) => s.loading);
  const error = useAnalyticsStore((s) => s.error);
  const fetchMetrics = useAnalyticsStore((s) => s.fetchMetrics);
  const smartSuggestions = useAnalyticsStore((s) => s.smartSuggestions);
  const fetchSmartSuggestions = useAnalyticsStore((s) => s.fetchSmartSuggestions);
  const exportCSV = useAnalyticsStore((s) => s.exportCSV);
  const setDateRange = useAnalyticsStore((s) => s.setDateRange);

  useEffect(() => {
    setDateRange(range);
    fetchMetrics();
    fetchSmartSuggestions();
  }, [range, setDateRange, fetchMetrics, fetchSmartSuggestions]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track performance across all platforms.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={() => fetchMetrics()}
            disabled={loading}
            className="h-11 md:h-8 gap-1.5 w-full sm:w-auto"
          >
            <RotateCw className={cn("size-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={loading}
            className="h-11 md:h-8 gap-1.5 w-full sm:w-auto"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
          <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
            <TabsList className="h-11 md:h-8 w-full sm:w-auto">
              {RANGES.map((item) => (
                <TabsTrigger key={item} value={item} className="text-xs px-3 flex-1 sm:flex-none">
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {smartSuggestions && (
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold">Smart Suggestions</h2>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Best times to post</p>
            <div className="flex flex-wrap gap-2">
              {smartSuggestions.bestTimes.map((time) => (
                <span key={time} className="text-xs rounded-full border border-border px-2 py-1">
                  {time}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Top platforms</p>
            <div className="flex flex-wrap gap-2">
              {smartSuggestions.topPlatforms.map((platform) => (
                <span key={platform} className="text-xs rounded-full border border-border px-2 py-1 capitalize">
                  {platform}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm">{smartSuggestions.weeklyInsight}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Loading analytics...</Card>
      ) : metrics.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No analytics yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Publish some posts to start seeing performance data.
          </p>
          <Button
            variant="outline"
            onClick={() => fetchMetrics()}
            className="mt-4 h-11 md:h-9"
          >
            Refresh analytics
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="p-4 space-y-3">
            <p className="text-sm font-medium">Impressions &amp; Engagements</p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="grad-imp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-eng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#a1a1aa" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Impressions" stroke="#38bdf8" fill="url(#grad-imp)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Engagements" stroke="#f472b6" fill="url(#grad-eng)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4 space-y-3">
            <p className="text-sm font-medium">Performance by Platform</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={platformStats} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#a1a1aa" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="impressions" name="Impressions" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="engagements" name="Engagements" fill="#f472b6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}
