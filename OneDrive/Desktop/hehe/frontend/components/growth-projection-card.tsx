"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BarChart2, Brain, Clock, Loader2, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface GrowthProjection {
  currentState: {
    postsPerWeek: number;
    avgImpressionsPerPost: number;
    avgEngagementRate: number;
    totalFollowers: Record<string, number>;
    weeklyReach: number;
    topPerformingFormat: string;
    bestPostingTime: string;
    accountAge: string;
  };
  projectedState: {
    postsPerWeek: number;
    projectedImpressionsPerPost: number;
    projectedEngagementRate: number;
    projectedWeeklyReach: number;
    projectedMonthlyClicks: number;
    timeToResults: string;
  };
  industryContext: {
    industry: string;
    avgEngagementRate: number;
    topPerformerEngagementRate: number;
    userPercentile: number;
    growthPotential: string;
  };
  insights: string[];
  confidence: "high" | "medium" | "low";
  dataPoints: number;
}

const CONFIDENCE_LABELS = {
  high: { label: "High confidence", color: "text-emerald-500 bg-emerald-500/10" },
  medium: { label: "Medium confidence", color: "text-amber-500 bg-amber-500/10" },
  low: { label: "Limited data", color: "text-muted-foreground bg-muted" },
};

export function GrowthProjectionCard({ className }: { className?: string }) {
  const [data, setData] = useState<GrowthProjection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<GrowthProjection>("/analytics/growth-projection")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const conf = CONFIDENCE_LABELS[data.confidence];
  const reachMultiplier = data.currentState.weeklyReach > 0
    ? (data.projectedState.projectedWeeklyReach / data.currentState.weeklyReach).toFixed(1)
    : "—";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-violet-500/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            Your Growth Projection
          </CardTitle>
          <Badge className={cn("text-[10px] px-2 py-0.5", conf.color)}>
            {conf.label} ({data.dataPoints} data points)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-5">
        {/* Current vs Projected comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Now</p>
            <MetricRow label="Posts/week" value={data.currentState.postsPerWeek.toString()} />
            <MetricRow label="Avg impressions" value={data.currentState.avgImpressionsPerPost.toLocaleString()} />
            <MetricRow label="Engagement rate" value={`${data.currentState.avgEngagementRate}%`} />
            <MetricRow label="Weekly reach" value={data.currentState.weeklyReach.toLocaleString()} />
          </div>
          <div className="space-y-3 relative">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
              <Zap className="size-3" /> Projected (90 days)
            </p>
            <MetricRow label="Posts/week" value={data.projectedState.postsPerWeek.toString()} highlight />
            <MetricRow label="Avg impressions" value={data.projectedState.projectedImpressionsPerPost.toLocaleString()} highlight />
            <MetricRow label="Engagement rate" value={`${data.projectedState.projectedEngagementRate}%`} highlight />
            <MetricRow label="Weekly reach" value={data.projectedState.projectedWeeklyReach.toLocaleString()} highlight />
            {/* Arrow between columns */}
            <div className="absolute left-0 top-1/2 -translate-x-[calc(50%+6px)] -translate-y-1/2">
              <ArrowRight className="size-4 text-primary" />
            </div>
          </div>
        </div>

        {/* Key metric */}
        {data.currentState.weeklyReach > 0 && (
          <div className="flex items-center justify-center gap-3 py-3 bg-primary/5 rounded-lg">
            <span className="text-3xl font-bold text-primary">{reachMultiplier}x</span>
            <span className="text-sm text-muted-foreground">projected reach increase</span>
          </div>
        )}

        {/* Monthly clicks projection */}
        {data.projectedState.projectedMonthlyClicks > 0 && (
          <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <BarChart2 className="size-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                ~{data.projectedState.projectedMonthlyClicks} clicks/month to your website
              </p>
              <p className="text-xs text-muted-foreground">
                Based on your industry&apos;s {(CONFIDENCE_LABELS[data.confidence].label === "Limited data" ? "average" : "your")} conversion rate
              </p>
            </div>
          </div>
        )}

        {/* Industry context */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Industry: {data.industryContext.industry}
          </p>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full"
              style={{ width: "100%" }}
            />
            {/* User position marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 size-3 bg-foreground rounded-full border-2 border-background shadow-sm"
              style={{ left: `${Math.min(95, data.industryContext.userPercentile)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Below avg</span>
            <span>Industry avg ({data.industryContext.avgEngagementRate}%)</span>
            <span>Top ({data.industryContext.topPerformerEngagementRate}%)</span>
          </div>
          <p className="text-xs text-muted-foreground italic">{data.industryContext.growthPotential}</p>
        </div>

        {/* Time to results */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5 shrink-0" />
          <span>Expected time to visible results: <strong className="text-foreground">{data.projectedState.timeToResults}</strong></span>
        </div>

        {/* Insights */}
        {data.insights.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Brain className="size-3" /> Data-driven insights
            </p>
            <ul className="space-y-2">
              {data.insights.map((insight, i) => (
                <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                  <span className="text-primary shrink-0 mt-0.5">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[9px] text-muted-foreground/60 italic pt-1">
          Projections based on your actual account data + industry benchmarks. Not guarantees. Results vary by content quality, audience, and market conditions.
        </p>
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold", highlight && "text-primary")}>{value}</span>
    </div>
  );
}
