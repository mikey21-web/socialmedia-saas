"use client";

import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const trends = [
  { source: "instagram", topic: "bridal glow packages", score: 91, velocity: "fast" },
  { source: "google", topic: "best gym near me", score: 82, velocity: "steady" },
  { source: "x", topic: "weekend cafe offers", score: 74, velocity: "rising" },
];

export default function AdminTrendSignalsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal flex items-center gap-2">
        <Flame className="size-5" /> Trend Signals
      </h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Active signals</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {trends.map((trend) => (
            <div key={trend.topic} className="grid gap-3 md:grid-cols-4 text-sm border-b pb-2 last:border-0">
              <span className="font-medium">{trend.topic}</span>
              <span>{trend.source}</span>
              <span>{trend.score}</span>
              <span>{trend.velocity}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
