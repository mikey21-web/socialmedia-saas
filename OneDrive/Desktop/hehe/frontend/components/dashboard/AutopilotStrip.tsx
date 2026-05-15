"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

interface AutopilotStatus {
  enabled: boolean;
  enabledAt: string | null;
  last7d: { published: number; pendingApproval: number };
}

export function AutopilotStrip() {
  const [status, setStatus] = useState<AutopilotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    api.get<AutopilotStatus>("/autopilot/status")
      .then((res) => setStatus(res.data))
      .catch(() => setStatus({ enabled: false, enabledAt: null, last7d: { published: 0, pendingApproval: 0 } }))
      .finally(() => setLoading(false));
  }, []);

  async function toggle() {
    if (!status) return;
    setToggling(true);
    try {
      const res = await api.post<AutopilotStatus>("/autopilot/toggle", { enabled: !status.enabled });
      setStatus(res.data);
    } finally {
      setToggling(false);
    }
  }

  if (loading) return <Skeleton className="h-20" />;

  const enabled = status?.enabled ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border p-4 flex items-center gap-4 ${enabled ? "border-violet-500/40 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent" : "border-border bg-card"}`}
    >
      <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${enabled ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground"}`}>
        <Bot className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">Autopilot {enabled ? "ON" : "OFF"}</p>
          {enabled && <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />}
        </div>
        {enabled ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            Last 7d: <span className="text-foreground font-medium">{status?.last7d.published}</span> posts published &middot;{" "}
            <span className="text-foreground font-medium">{status?.last7d.pendingApproval}</span> awaiting your review
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">
            Let Brain plan, draft, schedule, and engage 24/7. You approve what matters.
          </p>
        )}
      </div>
      <Button variant={enabled ? "outline" : "default"} onClick={toggle} disabled={toggling} className="shrink-0 gap-1.5">
        {enabled ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        {enabled ? "Pause" : "Turn on"}
      </Button>
    </motion.div>
  );
}
