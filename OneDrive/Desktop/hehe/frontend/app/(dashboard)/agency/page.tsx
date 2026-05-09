"use client";

import { useEffect, useState } from "react";
import { Brain, BarChart2, Image, MessageSquare, Pen, Zap, Loader2, Play, Pause } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface AgencyStatus {
  hasActiveStrategy: boolean;
  strategyName?: string;
  strategyDaysRemaining: number;
  hasBrandVoice: boolean;
  brandVoiceName?: string;
  recentAgentRuns: number;
  pendingEngagementActions: number;
}

const specialists = [
  { name: "Strategist", icon: Brain, color: "text-blue-500", desc: "90-day content strategy & planning" },
  { name: "Copywriter", icon: Pen, color: "text-green-500", desc: "Brand-voice matched content creation" },
  { name: "Designer", icon: Image, color: "text-purple-500", desc: "AI-powered visual content generation" },
  { name: "Analyst", icon: BarChart2, color: "text-orange-500", desc: "Performance insights & reporting" },
  { name: "Engagement Mgr", icon: MessageSquare, color: "text-pink-500", desc: "Auto-reply & community management" },
];

export default function AgencyDashboard() {
  const [status, setStatus] = useState<AgencyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    api.get("/api/agency/orchestrator/status").then((r) => {
      setStatus(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function runCycle() {
    setRunning(true);
    try {
      await api.post("/api/agency/orchestrator/run-now");
      const r = await api.get("/api/agency/orchestrator/status");
      setStatus(r.data);
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="size-6 text-yellow-500" />
            Your AI Marketing Team
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            5 AI specialists working on your brand 24/7
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runCycle} disabled={running} className="gap-2">
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Run Daily Cycle
          </Button>
        </div>
      </div>

      {/* Specialist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {specialists.map((s) => (
          <Card key={s.name} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <s.icon className={`size-5 ${s.color}`} />
                <CardTitle className="text-sm font-medium">{s.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            {status?.hasActiveStrategy ? (
              <>
                <p className="text-lg font-semibold">{status.strategyName}</p>
                <Badge variant="secondary" className="mt-1">
                  {status.strategyDaysRemaining} days remaining
                </Badge>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No active strategy. Create one to get started.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Brand Voice</CardTitle>
          </CardHeader>
          <CardContent>
            {status?.hasBrandVoice ? (
              <>
                <p className="text-lg font-semibold">{status.brandVoiceName}</p>
                <Badge variant="secondary" className="mt-1">Active</Badge>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No brand voice trained yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Engagement Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{status?.pendingEngagementActions ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">pending actions</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent AI Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {status?.recentAgentRuns ?? 0} agent runs in the last 24 hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
