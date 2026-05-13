"use client";

import { useEffect, useState } from "react";
import { Brain, Lightbulb, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface Insight {
  insightType: string;
  pattern: string;
  multiplier: number;
  confidence: number;
  description: string;
}

const INSIGHT_ICONS: Record<string, typeof Brain> = {
  hook_type: Lightbulb,
  posting_time: Zap,
  content_format: TrendingUp,
  cta_style: Brain,
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Learning...",
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/learning-loop/insights")
      .then((r) => setInsights(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getConfidenceLevel = (c: number) => c >= 0.7 ? "high" : c >= 0.4 ? "medium" : "low";

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="size-6 text-purple-500" />
          Performance Insights
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your AI learns what works for YOUR account. These patterns are auto-applied to future content.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <Card className="p-8 text-center">
          <Brain className="size-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Not enough data yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Publish 10+ posts and we&apos;ll start detecting what works best for your audience.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const Icon = INSIGHT_ICONS[insight.insightType] ?? Brain;
            const level = getConfidenceLevel(insight.confidence);
            const isPositive = insight.multiplier > 1;

            return (
              <Card key={i} className="overflow-hidden">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className={`size-10 rounded-full flex items-center justify-center ${isPositive ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    <Icon className={`size-5 ${isPositive ? "text-green-500" : "text-red-500"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{insight.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {insight.insightType.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {CONFIDENCE_LABELS[level]}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}>
                      {isPositive ? "+" : ""}{Math.round((insight.multiplier - 1) * 100)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">vs average</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">
            <strong>How it works:</strong> Every week, we analyze your last 30 days of posts to find patterns.
            When we detect that a specific hook style, posting time, or format consistently outperforms your average,
            we automatically apply those patterns to future AI-generated content.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
