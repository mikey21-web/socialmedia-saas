"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  type: "opportunity" | "warning" | "tip";
  title: string;
  body: string;
  cta: string;
  href: string;
}

const ICONS: Record<Insight["type"], { Icon: React.ElementType; color: string }> = {
  opportunity: { Icon: TrendingUp,  color: "text-emerald-500" },
  warning:     { Icon: AlertCircle, color: "text-amber-500" },
  tip:         { Icon: Lightbulb,   color: "text-violet-500" },
};

export function AiInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ insights: Insight[] }>("/dashboard/insights")
      .then((res) => setInsights(res.data.insights))
      .catch(() => setInsights([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-64" />;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="size-4 text-violet-500" />
        <p className="text-sm font-medium">Brain — Today&apos;s insights</p>
      </div>
      {insights.length === 0 ? (
        <p className="text-xs text-muted-foreground">Brain is observing. Insights appear once you have 7+ days of activity.</p>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => {
            const { Icon, color } = ICONS[insight.type];
            return (
              <div key={insight.id} className="flex gap-3 p-3 rounded-md bg-muted/30 border border-border">
                <Icon className={cn("size-4 shrink-0 mt-0.5", color)} />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">{insight.body}</p>
                  <Link href={insight.href} className="text-xs font-medium inline-flex items-center gap-1 hover:underline">
                    {insight.cta} <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
