"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompetitorDigest, type WeeklyDigest } from "@/components/competitors/CompetitorDigest";
import { api } from "@/lib/api";

export default function CompetitorsPage() {
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchDigest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<WeeklyDigest>("/agents/competitors/digest");
      setDigest(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  async function runSnapshot() {
    setRunning(true);
    setNotice(null);
    try {
      const res = await api.post<{ snapshots: number }>("/agents/competitors/run");
      setNotice(`Snapshot complete — ${res.data.snapshots} competitor profiles updated`);
      fetchDigest();
    } catch {
      setNotice("Competitor snapshot failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Competitor Intel
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Weekly digest of what your competitors are doing
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={runSnapshot} disabled={running}>
          <RefreshCw className={`size-4 mr-2 ${running ? "animate-spin" : ""}`} />
          {running ? "Fetching…" : "Refresh"}
        </Button>
      </div>

      {notice && (
        <div className="text-sm px-3 py-2 rounded bg-muted text-muted-foreground">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : digest ? (
        <CompetitorDigest digest={digest} />
      ) : (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <Users className="size-8 mx-auto mb-3 opacity-30" />
          <p>No competitor data yet.</p>
          <p className="mt-1">Add competitors in your brand settings, then click Refresh.</p>
        </div>
      )}
    </div>
  );
}
