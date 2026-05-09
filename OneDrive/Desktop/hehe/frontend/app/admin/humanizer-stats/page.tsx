"use client";

import { Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Avg before score", value: "46" },
  { label: "Avg after score", value: "18" },
  { label: "High-risk saves", value: "312" },
];

export default function AdminHumanizerStatsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal flex items-center gap-2">
        <Wand2 className="size-5" /> Humanizer Stats
      </h1>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{stat.label}</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-semibold">{stat.value}</div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
