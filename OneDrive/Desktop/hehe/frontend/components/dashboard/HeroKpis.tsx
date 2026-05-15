"use client";
import { useEffect } from "react";
import { TrendingUp, TrendingDown, Users, BarChart2, Eye, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/store/dashboard";
import { Sparkline } from "./Sparkline";
import { CountUp } from "./CountUp";
import { cn } from "@/lib/utils";

type Kpi = {
  label: string;
  value: number;
  delta: number;
  icon: React.ElementType;
  series: number[];
  color: string;
  prefix?: string;
};

export function HeroKpis() {
  const summary = useDashboardStore((s) => s.summary);
  const loading = useDashboardStore((s) => s.loading);
  const fetchSummary = useDashboardStore((s) => s.fetchSummary);

  useEffect(() => {
    fetchSummary();
    const id = window.setInterval(fetchSummary, 60_000);
    return () => window.clearInterval(id);
  }, [fetchSummary]);

  if (loading && !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  const kpis: Kpi[] = [
    { label: "Followers (all)",  value: 12847, delta:  4.2, icon: Users,       series: summary?.sparklines.followers ?? [],  color: "#10b981" },
    { label: "Engagement rate",  value: 3.8,   delta:  0.6, icon: BarChart2,   series: summary?.sparklines.engagement ?? [], color: "#8b5cf6" },
    { label: "Reach 7d",         value: 248000,delta: -2.1, icon: Eye,         series: summary?.sparklines.reach ?? [],      color: "#f59e0b" },
    { label: "AI saved",         value: 1247,  delta: 12.0, icon: DollarSign,  series: [],                                    color: "#06b6d4", prefix: "$" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((k) => {
        const Icon = k.icon;
        const positive = k.delta >= 0;
        return (
          <Card key={k.label} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold">
                {k.prefix}<CountUp value={k.value} />
              </p>
              <span className={cn("text-xs font-medium flex items-center gap-0.5", positive ? "text-emerald-500" : "text-red-500")}>
                {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {Math.abs(k.delta).toFixed(1)}%
              </span>
            </div>
            <div className="h-8" style={{ color: k.color }}>
              <Sparkline data={k.series} color={k.color} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
