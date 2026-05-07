"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, BarChart2, Clock, Hash, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformBadge, type Platform } from "@/components/platform-badge";
import { PLATFORM_HEX, useAnalyticsStore, type AnalyticsPreset, type AnalyticsTopPost, type PlatformROI, type BestPostingTime, type ContentTrends } from "@/store/analytics";
import { ExportButton } from "../posts/export-button";

const PRESETS: Array<{ value: AnalyticsPreset; label: string; days?: number }> = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "custom", label: "Custom" },
];

const TOOLTIP_STYLE = {
  background: "rgba(10, 10, 15, 0.94)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  color: "#f8fafc",
};

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildRange(days: number) {
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  return {
    from: toDateInput(start),
    to: toDateInput(end),
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatDelta(current: number, previous: number) {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, positive: current >= previous };
  }
  const delta = ((current - previous) / previous) * 100;
  return { value: delta, positive: delta >= 0 };
}

function TopPostsTable({
  rows,
  onSort,
}: {
  rows: AnalyticsTopPost[];
  onSort: (key: "title" | "platform" | "impressions" | "engagements" | "rate") => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="py-3 pr-4">
              <button type="button" onClick={() => onSort("title")}>Post title</button>
            </th>
            <th className="px-4 py-3">
              <button type="button" onClick={() => onSort("platform")}>Platform</button>
            </th>
            <th className="px-4 py-3 text-right">
              <button type="button" onClick={() => onSort("impressions")}>Impressions</button>
            </th>
            <th className="px-4 py-3 text-right">
              <button type="button" onClick={() => onSort("engagements")}>Engagements</button>
            </th>
            <th className="pl-4 py-3 text-right">
              <button type="button" onClick={() => onSort("rate")}>Eng. Rate</button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((post) => {
            const rate = post.impressions > 0 ? (post.engagements / post.impressions) * 100 : 0;
            return (
              <tr key={post.postId} className="border-b border-border/60 last:border-b-0">
                <td className="py-3 pr-4 font-medium">
                  <span className="block max-w-[320px] truncate">{post.title}</span>
                </td>
                <td className="px-4 py-3">
                  <PlatformBadge platform={post.platform as Platform} />
                </td>
                <td className="px-4 py-3 text-right">{formatNumber(post.impressions)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(post.engagements)}</td>
                <td className="pl-4 py-3 text-right">{rate.toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyticsPage() {
  const defaultRange = buildRange(30);
  const [customFrom, setCustomFrom] = useState(defaultRange.from);
  const [customTo, setCustomTo] = useState(defaultRange.to);
  const [sortKey, setSortKey] = useState<"title" | "platform" | "impressions" | "engagements" | "rate">("engagements");

  const preset = useAnalyticsStore((state) => state.preset);
  const from = useAnalyticsStore((state) => state.from);
  const to = useAnalyticsStore((state) => state.to);
  const summary = useAnalyticsStore((state) => state.summary);
  const previousSummary = useAnalyticsStore((state) => state.previousSummary);
  const lastUpdated = useAnalyticsStore((state) => state.lastUpdated);
  const loading = useAnalyticsStore((state) => state.loading);
  const error = useAnalyticsStore((state) => state.error);
  const setRange = useAnalyticsStore((state) => state.setRange);
  const fetchSummary = useAnalyticsStore((state) => state.fetchSummary);
  const fetchLastUpdated = useAnalyticsStore((state) => state.fetchLastUpdated);
  const platformROI = useAnalyticsStore((state) => state.platformROI);
  const bestPostingTimes = useAnalyticsStore((state) => state.bestPostingTimes);
  const contentTrends = useAnalyticsStore((state) => state.contentTrends);
  const fetchPlatformROI = useAnalyticsStore((state) => state.fetchPlatformROI);
  const fetchBestPostingTimes = useAnalyticsStore((state) => state.fetchBestPostingTimes);
  const fetchContentTrends = useAnalyticsStore((state) => state.fetchContentTrends);

  useEffect(() => {
    void fetchSummary(from, to);
    void fetchLastUpdated();
    void fetchPlatformROI(from, to);
    void fetchBestPostingTimes();
    void fetchContentTrends();
  }, [fetchSummary, fetchLastUpdated, from, to, fetchPlatformROI, fetchBestPostingTimes, fetchContentTrends]);

  const metricsStatus = useMemo(() => {
    if (!lastUpdated) return 'Pending';
    const updated = new Date(lastUpdated);
    const now = new Date();
    const diffMs = now.getTime() - updated.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1) return 'Pending';
    return updated.toLocaleString();
  }, [lastUpdated]);

  const platformSeries = useMemo(
    () => summary?.byPlatform.map((entry) => entry.platform as Platform) ?? [],
    [summary],
  );

  const topPosts = useMemo(() => {
    const items = [...(summary?.topPosts ?? [])];
    items.sort((a, b) => {
      if (sortKey === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortKey === "platform") {
        return a.platform.localeCompare(b.platform);
      }
      if (sortKey === "impressions") {
        return b.impressions - a.impressions;
      }
      if (sortKey === "engagements") {
        return b.engagements - a.engagements;
      }
      const aRate = a.impressions > 0 ? a.engagements / a.impressions : 0;
      const bRate = b.impressions > 0 ? b.engagements / b.impressions : 0;
      return bRate - aRate;
    });
    return items;
  }, [sortKey, summary]);

  const reachData = useMemo(
    () =>
      (summary?.byPlatform ?? []).map((entry) => ({
        name: entry.platform,
        value: entry.impressions + entry.likes + entry.comments + entry.shares,
      })),
    [summary],
  );

  const stats = useMemo(() => {
    if (!summary) {
      return [];
    }

    const previous = previousSummary ?? {
      totalImpressions: 0,
      totalReach: 0,
      totalEngagements: 0,
    };

    const engagementRate = summary.totalImpressions > 0
      ? (summary.totalEngagements / summary.totalImpressions) * 100
      : 0;
    const previousRate = previous.totalImpressions > 0
      ? (previous.totalEngagements / previous.totalImpressions) * 100
      : 0;

    return [
      {
        label: "Total Impressions",
        value: formatNumber(summary.totalImpressions),
        delta: formatDelta(summary.totalImpressions, previous.totalImpressions),
      },
      {
        label: "Total Reach",
        value: formatNumber(summary.totalReach),
        delta: formatDelta(summary.totalReach, previous.totalReach),
      },
      {
        label: "Total Engagements",
        value: formatNumber(summary.totalEngagements),
        delta: formatDelta(summary.totalEngagements, previous.totalEngagements),
      },
      {
        label: "Engagement Rate",
        value: `${engagementRate.toFixed(1)}%`,
        delta: formatDelta(engagementRate, previousRate),
      },
    ];
  }, [previousSummary, summary]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Performance snapshots, reach breakdowns, and top-performing content.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Metrics: {metricsStatus}
          </p>
        </div>
        <div className="flex flex-col gap-3 xl:items-end">
          <div className="flex items-center gap-2">
            <ExportButton type="posts" />
            <ExportButton type="trends" />
          </div>
          <Tabs
            value={preset}
            onValueChange={(value) => {
              const nextPreset = value as AnalyticsPreset;
              if (nextPreset === "custom") {
                setRange("custom", customFrom, customTo);
                return;
              }
              const selected = PRESETS.find((item) => item.value === nextPreset);
              const range = buildRange(selected?.days ?? 30);
              setRange(nextPreset, range.from, range.to);
            }}
          >
            <TabsList className="h-auto flex-wrap justify-start xl:justify-end">
              {PRESETS.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {preset === "custom" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
              <Input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
              <Button type="button" variant="outline" onClick={() => setRange("custom", customFrom, customTo)}>
                Apply
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="gap-1">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={stat.delta.positive ? "text-emerald-400" : "text-rose-400"}>
                <span className="inline-flex items-center gap-1 text-xs font-medium">
                  {stat.delta.positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                  {Math.abs(stat.delta.value).toFixed(1)}% vs previous period
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && !summary ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading analytics...
          </CardContent>
        </Card>
      ) : summary ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Impressions over time</CardTitle>
                <CardDescription>One area per connected platform.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.byDayPlatform} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      {platformSeries.map((platform) => (
                        <linearGradient key={platform} id={`gradient-${platform}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PLATFORM_HEX[platform]} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={PLATFORM_HEX[platform]} stopOpacity={0.05} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend />
                    {platformSeries.map((platform) => (
                      <Area
                        key={platform}
                        type="monotone"
                        dataKey={platform}
                        stroke={PLATFORM_HEX[platform]}
                        fill={`url(#gradient-${platform})`}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reach breakdown</CardTitle>
                <CardDescription>Share of total reach by platform.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reachData} dataKey="value" nameKey="name" innerRadius={72} outerRadius={108} paddingAngle={2}>
                      {reachData.map((entry) => (
                        <Cell key={entry.name} fill={PLATFORM_HEX[entry.name as Platform] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Platform breakdown</CardTitle>
                <CardDescription>Grouped performance by connected network.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.byPlatform} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <XAxis dataKey="platform" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend />
                    <Bar dataKey="impressions" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="reach" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="likes" fill="#f472b6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="comments" fill="#34d399" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="shares" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily totals</CardTitle>
                <CardDescription>All-platform impressions and engagements.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.byDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="daily-impressions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="daily-engagements" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend />
                    <Area type="monotone" dataKey="impressions" stroke="#60a5fa" fill="url(#daily-impressions)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="engagements" stroke="#34d399" fill="url(#daily-engagements)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Platform ROI</CardTitle>
                <CardDescription>Return on investment by platform.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformROI} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <XAxis dataKey="platform" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend />
                    <Bar dataKey="impressions" fill="#60a5fa" stackId="a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="engagements" fill="#34d399" stackId="a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="reach" fill="#a78bfa" stackId="b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Best posting times</CardTitle>
                <CardDescription>Top 3 time slots per platform by avg engagement.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px] overflow-y-auto">
                <div className="space-y-4">
                  {Object.entries(bestPostingTimes).map(([platform, times]) => (
                    <div key={platform}>
                      <div className="mb-2 flex items-center gap-2">
                        <PlatformBadge platform={platform as Platform} />
                      </div>
                      <div className="space-y-1">
                        {times.map((slot, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="size-3.5" />
                              {slot.day} {slot.hour}:00
                            </span>
                            <span className="font-medium">{Math.round(slot.avgEngagement)} avg engagement</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(bestPostingTimes).length === 0 && (
                    <p className="text-sm text-muted-foreground">Not enough data yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Content trends</CardTitle>
                <CardDescription>Trending hashtags and content types.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <div className="mb-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Hash className="size-4" />
                    Top Hashtags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contentTrends?.topHashtags.slice(0, 10).map((item) => (
                      <span
                        key={item.tag}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs"
                      >
                        {item.tag}
                        <span className="text-muted-foreground">({item.count})</span>
                      </span>
                    ))}
                    {(!contentTrends || contentTrends.topHashtags.length === 0) && (
                      <p className="text-sm text-muted-foreground">No trending hashtags.</p>
                    )}
                  </div>
                </div>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contentTrends?.contentTypeBreakdown ?? []}
                        dataKey="count"
                        nameKey="type"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                      >
                        {contentTrends?.contentTypeBreakdown.map((entry, index) => (
                          <Cell
                            key={entry.type}
                            fill={['#60a5fa', '#34d399', '#fbbf24'][index % 3]}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement prediction tips</CardTitle>
                <CardDescription>AI-generated suggestions for better engagement.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="size-4 text-amber-400" />
                    Tips for better performance
                  </div>
                  <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
                    <li>Keep captions between 100-280 characters for best engagement.</li>
                    <li>Include 1-3 relevant hashtags for discoverability.</li>
                    <li>Use questions or CTAs to drive comments and shares.</li>
                    <li>Post during peak hours: mornings (9-11am) and evenings (6-9pm).</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top performing posts</CardTitle>
              <CardDescription>Sorted by the metric you care about most.</CardDescription>
            </CardHeader>
            <CardContent>
              <TopPostsTable rows={topPosts} onSort={setSortKey} />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
