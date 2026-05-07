"use client";

import { AlertTriangle, ChevronRight, Lightbulb, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface WeeklyDigest {
  summary: string;
  topPerforming: Array<{ competitor: string; what: string; why: string }>;
  gaps: Array<{ opportunity: string; reason: string }>;
  watchOut: string;
  recommendation: string;
}

export function CompetitorDigest({ digest }: { digest: WeeklyDigest }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            Weekly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{digest.summary}</p>
        </CardContent>
      </Card>

      {digest.topPerforming.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">What Worked for Them</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {digest.topPerforming.map((item, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <ChevronRight className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                <div>
                  <span className="font-medium">{item.competitor}</span>
                  <span className="text-muted-foreground"> — {item.what}</span>
                  <p className="text-xs text-muted-foreground mt-0.5 italic">{item.why}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {digest.gaps.length > 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="size-4 text-green-500" />
              Your Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {digest.gaps.map((gap, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <ChevronRight className="size-4 shrink-0 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">{gap.opportunity}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{gap.reason}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="size-4 text-yellow-500" />
            Watch Out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{digest.watchOut}</p>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">
            This Week&apos;s Action
          </p>
          <p className="text-sm font-medium">{digest.recommendation}</p>
        </CardContent>
      </Card>
    </div>
  );
}
