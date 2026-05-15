"use client";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

type Range = "7d" | "30d" | "90d";
type Metric = "likes" | "comments" | "reach";

interface EngagementData {
  days: string[];
  series: Record<Metric, number[]>;
}

export function EngagementChart() {
  const [range, setRange] = useState<Range>("30d");
  const [metric, setMetric] = useState<Metric>("likes");
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<EngagementData>(`/dashboard/engagement?range=${range}`)
      .then((res) => setData(res.data))
      .catch(() => setData({ days: [], series: { likes: [], comments: [], reach: [] } }))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) return <Skeleton className="h-64" />;

  const chartData = (data?.days ?? []).map((d, i) => ({
    day: d.slice(5),
    value: data?.series[metric][i] ?? 0,
  }));

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <p className="text-sm font-medium">Engagement</p>
        <div className="flex items-center gap-3">
          <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
            <TabsList className="h-8">
              <TabsTrigger value="likes" className="text-xs h-6">Likes</TabsTrigger>
              <TabsTrigger value="comments" className="text-xs h-6">Comments</TabsTrigger>
              <TabsTrigger value="reach" className="text-xs h-6">Reach</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
            <TabsList className="h-8">
              <TabsTrigger value="7d" className="text-xs h-6">7d</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs h-6">30d</TabsTrigger>
              <TabsTrigger value="90d" className="text-xs h-6">90d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="engagement-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="url(#engagement-fill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
