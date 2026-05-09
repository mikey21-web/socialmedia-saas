"use client";

import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "boneyard-js/react";
import { Flame, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrendCard, type TrendItem } from "@/components/trends/TrendCard";
import { api } from "@/lib/api";

const FILTERS = [
  { label: "All Active", value: "pending" },
  { label: "Converted", value: "converted" },
];

export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [notice, setNotice] = useState<string | null>(null);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ items: TrendItem[]; total: number }>(
        `/agents/trends?status=${filter}&limit=30`,
      );
      setTrends(res.data.items);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  async function runScan() {
    setRunning(true);
    setNotice(null);
    try {
      const res = await api.post<{ stored: number; converted: number }>("/agents/trends/run");
      setNotice(`Scan complete — ${res.data.stored} new trends, ${res.data.converted} auto-converted`);
      fetchTrends();
    } catch {
      setNotice("Trend scan failed");
    } finally {
      setRunning(false);
    }
  }

  async function handleConvert(id: string) {
    await api.post(`/agents/trends/${id}/convert`);
    setNotice("Post drafts added to Inbox");
    fetchTrends();
  }

  async function handleDismiss(id: string) {
    await api.post(`/agents/trends/${id}/dismiss`);
    setTrends((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <Skeleton name="trends-page" loading={loading}>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Flame className="size-5 text-orange-500" />
            Trend Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} trend{total !== 1 ? "s" : ""} scored for your brand
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={runScan} disabled={running}>
          <RefreshCw className={`size-4 mr-2 ${running ? "animate-spin" : ""}`} />
          {running ? "Scanning…" : "Scan Now"}
        </Button>
      </div>

      {notice && (
        <div className="text-sm px-3 py-2 rounded bg-muted text-muted-foreground">
          {notice}
        </div>
      )}

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : trends.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <Flame className="size-8 mx-auto mb-3 opacity-30" />
          <p>No trends yet. Click &quot;Scan Now&quot; to fetch today&apos;s trends.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trends.map((trend) => (
            <TrendCard
              key={trend.id}
              trend={trend}
              onConvert={handleConvert}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
      </div>
    </Skeleton>
  );
}
