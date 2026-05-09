"use client";

import { useEffect, useState } from "react";
import { Brain, CalendarDays, Loader2, Plus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface ContentPillar {
  topic: string;
  percentage: number;
  examples: string[];
}

interface CampaignPlan {
  name: string;
  dates: string;
  theme: string;
  postsCount: number;
}

interface Strategy {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  contentMix: Record<string, number>;
  pillars: ContentPillar[];
  goals: Record<string, number>;
  platforms: string[];
  postingCadence: Record<string, string>;
  campaignPlan: CampaignPlan[];
  status: string;
  createdAt: string;
}

interface Brief {
  date: string;
  pillarTopic: string;
  contentType: string;
  platform: string;
  targetWordCount: number;
  notes: string;
}

const PILLAR_COLORS = [
  "bg-blue-500/20 text-blue-400",
  "bg-green-500/20 text-green-400",
  "bg-purple-500/20 text-purple-400",
  "bg-orange-500/20 text-orange-400",
  "bg-pink-500/20 text-pink-400",
  "bg-yellow-500/20 text-yellow-400",
];

export default function StrategyPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [loadingBriefs, setLoadingBriefs] = useState(false);

  useEffect(() => {
    api.get("/api/agency/strategist/strategies").then((r) => {
      setStrategies(r.data);
      if (r.data.length > 0) setSelectedStrategy(r.data[0]);
    }).finally(() => setLoading(false));
  }, []);

  async function loadBriefs(strategyId: string) {
    setLoadingBriefs(true);
    try {
      const r = await api.get(`/api/agency/strategist/weekly-briefs/${strategyId}`);
      setBriefs(r.data);
    } finally {
      setLoadingBriefs(false);
    }
  }

  async function refine(strategyId: string) {
    await api.post(`/api/agency/strategist/refine/${strategyId}`);
    const r = await api.get("/api/agency/strategist/strategies");
    setStrategies(r.data);
  }

  useEffect(() => {
    if (selectedStrategy) loadBriefs(selectedStrategy.id);
  }, [selectedStrategy]);

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
            <Brain className="size-6 text-blue-500" />
            Content Strategy
          </h1>
          <p className="text-muted-foreground text-sm mt-1">90-day plans with content pillars and campaigns</p>
        </div>
      </div>

      {strategies.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No strategies created yet. Generate your first 90-day plan.</p>
          <Button className="gap-2"><Plus className="size-4" /> Generate Strategy</Button>
        </Card>
      ) : (
        <>
          {/* Strategy Summary */}
          {selectedStrategy && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{selectedStrategy.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(selectedStrategy.startDate).toLocaleDateString()} — {new Date(selectedStrategy.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={selectedStrategy.status === "active" ? "default" : "secondary"}>
                    {selectedStrategy.status}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => refine(selectedStrategy.id)} className="gap-1">
                    <RefreshCw className="size-3" /> Refine
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content Mix */}
                <div>
                  <p className="text-sm font-medium mb-2">Content Mix</p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(selectedStrategy.contentMix).map(([type, pct]) => (
                      <Badge key={type} variant="outline">{type}: {pct}%</Badge>
                    ))}
                  </div>
                </div>

                {/* Pillars */}
                <div>
                  <p className="text-sm font-medium mb-2">Content Pillars</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(selectedStrategy.pillars ?? []).map((p, i) => (
                      <div key={i} className={`rounded-lg p-3 ${PILLAR_COLORS[i % PILLAR_COLORS.length]}`}>
                        <p className="font-medium text-sm">{p.topic}</p>
                        <p className="text-xs opacity-80">{p.percentage}% of content</p>
                        {p.examples?.length > 0 && (
                          <ul className="mt-1 text-xs opacity-70">
                            {p.examples.slice(0, 2).map((ex, j) => <li key={j}>• {ex}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campaigns */}
                {(selectedStrategy.campaignPlan ?? []).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Campaign Plan</p>
                    <div className="space-y-2">
                      {selectedStrategy.campaignPlan.map((c, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md border p-3">
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.theme} • {c.dates}</p>
                          </div>
                          <Badge variant="secondary">{c.postsCount} posts</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posting Cadence */}
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(selectedStrategy.postingCadence ?? {}).map(([platform, freq]) => (
                    <Badge key={platform} variant="outline" className="capitalize">{platform}: {freq}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly Briefs */}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <CalendarDays className="size-5" /> Weekly Content Briefs
            </h2>
            {loadingBriefs ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="size-4 animate-spin" /> Loading briefs...
              </div>
            ) : briefs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No briefs generated yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {briefs.map((b, i) => (
                  <Card key={i}>
                    <CardContent className="pt-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{b.date}</Badge>
                        <Badge variant="secondary" className="text-xs capitalize">{b.platform}</Badge>
                      </div>
                      <p className="font-medium text-sm">{b.pillarTopic}</p>
                      <p className="text-xs text-muted-foreground capitalize">{b.contentType} • {b.targetWordCount} words</p>
                      {b.notes && <p className="text-xs text-muted-foreground">{b.notes}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
