"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HealthData {
  status: string;
  db: string;
  redis: string;
  uptime: number;
  version: string;
  timestamp: string;
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  async function fetchHealth() {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const res = await fetch(`${apiUrl}/health`);
      setHealth(await res.json());
    } catch {
      setHealth(null);
    }
    setLastChecked(new Date());
    setLoading(false);
  }

  useEffect(() => { fetchHealth(); }, []);

  const isUp = health?.status === "ok";
  const isDegraded = health?.status === "degraded";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">System Status</h1>
          <div className="flex items-center justify-center gap-2 text-lg">
            {loading ? (
              <RefreshCw className="size-5 animate-spin text-muted-foreground" />
            ) : isUp ? (
              <><CheckCircle2 className="size-6 text-emerald-500" /><span className="text-emerald-500 font-semibold">All Systems Operational</span></>
            ) : isDegraded ? (
              <><AlertCircle className="size-6 text-amber-500" /><span className="text-amber-500 font-semibold">Degraded Performance</span></>
            ) : (
              <><XCircle className="size-6 text-destructive" /><span className="text-destructive font-semibold">Service Disruption</span></>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {[
            { name: "API Server", status: health ? "operational" : "down" },
            { name: "Database (PostgreSQL)", status: health?.db === "ok" ? "operational" : "down" },
            { name: "Cache (Redis)", status: health?.redis === "ok" ? "operational" : health?.redis === "not_configured" ? "n/a" : "degraded" },
            { name: "Frontend (Vercel)", status: "operational" },
            { name: "CDN (Cloudflare)", status: "operational" },
          ].map((service) => (
            <div key={service.name} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <span className="font-medium text-sm">{service.name}</span>
              <div className="flex items-center gap-2">
                {service.status === "operational" ? (
                  <><div className="size-2.5 rounded-full bg-emerald-500" /><span className="text-xs text-emerald-500">Operational</span></>
                ) : service.status === "degraded" ? (
                  <><div className="size-2.5 rounded-full bg-amber-500" /><span className="text-xs text-amber-500">Degraded</span></>
                ) : service.status === "n/a" ? (
                  <><div className="size-2.5 rounded-full bg-muted-foreground" /><span className="text-xs text-muted-foreground">N/A</span></>
                ) : (
                  <><div className="size-2.5 rounded-full bg-destructive" /><span className="text-xs text-destructive">Down</span></>
                )}
              </div>
            </div>
          ))}
        </div>

        {health && (
          <div className="p-4 bg-muted/30 border border-border rounded-lg text-sm text-muted-foreground space-y-1">
            <p><strong>Version:</strong> {health.version}</p>
            <p><strong>Uptime:</strong> {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loading} className="gap-2">
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>For incident updates, follow <a href="https://x.com/diyaaai" className="underline">@diyaaai</a> on X.</p>
          <p className="mt-1">Report issues: <a href="mailto:support@diyaa.ai" className="underline">support@diyaa.ai</a></p>
        </div>
      </div>
    </div>
  );
}
