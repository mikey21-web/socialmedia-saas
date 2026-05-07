"use client";

import { useState } from "react";
import { ExternalLink, Flame, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface TrendItem {
  id: string;
  title: string;
  summary: string;
  url?: string;
  source: string;
  relevanceScore: number;
  brandFitReason?: string;
  pillar?: string;
  status: "pending" | "converted" | "dismissed";
  detectedAt: string;
}

interface TrendCardProps {
  trend: TrendItem;
  onConvert: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}

export function TrendCard({ trend, onConvert, onDismiss }: TrendCardProps) {
  const [converting, setConverting] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const scoreColor =
    trend.relevanceScore >= 8
      ? "text-green-500"
      : trend.relevanceScore >= 6
        ? "text-yellow-500"
        : "text-muted-foreground";

  async function handleConvert() {
    setConverting(true);
    try {
      await onConvert(trend.id);
    } finally {
      setConverting(false);
    }
  }

  async function handleDismiss() {
    setDismissing(true);
    try {
      await onDismiss(trend.id);
    } finally {
      setDismissing(false);
    }
  }

  if (trend.status === "dismissed") return null;

  return (
    <Card
      className={cn(
        "border transition-colors",
        trend.relevanceScore >= 8 && "border-orange-500/40 bg-orange-500/5",
        trend.status === "converted" && "opacity-60",
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {trend.relevanceScore >= 8 && (
                <Flame className="size-3.5 text-orange-500 shrink-0" />
              )}
              <span className={cn("text-xs font-semibold tabular-nums", scoreColor)}>
                {trend.relevanceScore.toFixed(1)}/10
              </span>
              <Badge variant="outline" className="text-xs py-0">
                {trend.source}
              </Badge>
              {trend.pillar && (
                <Badge variant="secondary" className="text-xs py-0">
                  {trend.pillar}
                </Badge>
              )}
              {trend.status === "converted" && (
                <Badge className="text-xs py-0 bg-green-600">Converted</Badge>
              )}
            </div>
            <h3
              className="text-sm font-medium leading-snug cursor-pointer hover:underline"
              onClick={() => setExpanded((v) => !v)}
            >
              {trend.title}
            </h3>
          </div>
          {trend.url && (
            <a
              href={trend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>

        {expanded && (
          <div className="text-xs text-muted-foreground space-y-2">
            <p className="leading-relaxed">{trend.summary.slice(0, 300)}</p>
            {trend.brandFitReason && (
              <div className="flex gap-1.5 p-2 rounded bg-muted/50">
                <Sparkles className="size-3 shrink-0 text-primary mt-0.5" />
                <span className="italic">{trend.brandFitReason}</span>
              </div>
            )}
          </div>
        )}

        {trend.status !== "converted" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleConvert}
              disabled={converting || dismissing}
            >
              {converting ? "Generating…" : "Generate Post"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Less" : "Why this?"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 ml-auto text-muted-foreground"
              onClick={handleDismiss}
              disabled={dismissing}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
