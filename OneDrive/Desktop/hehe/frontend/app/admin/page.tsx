"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

type Metrics = {
  totalTeams: number;
  totalUsers: number;
  postsThisWeek: number;
  activeSubscriptions: number;
};

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    api.get<Metrics>("/api/admin/metrics").then((response) => setMetrics(response.data)).catch(() => undefined);
  }, []);

  const cards = [
    ["Teams", metrics?.totalTeams],
    ["Users", metrics?.totalUsers],
    ["Posts this week", metrics?.postsThisWeek],
    ["Subscriptions", metrics?.activeSubscriptions],
  ];

  return (
    <div className="grid gap-4 p-4 md:grid-cols-4 md:p-6">
      {cards.map(([label, value]) => (
        <Card key={label} className="p-4">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value ?? "..."}</p>
        </Card>
      ))}
    </div>
  );
}
