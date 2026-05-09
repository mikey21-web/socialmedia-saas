"use client";

import { useEffect, useState } from "react";
import { Flame, Loader2, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface TrendSignal {
  id: string;
  platform: string;
  signalType: string;
  value: string;
  popularity: number;
  velocity: number;
  category: string | null;
  expiresAt: string;
  createdAt: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  x: "bg-slate-800 text-white",
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  tiktok: "bg-black text-white",
  google: "bg-blue-500 text-white",
};

export default function TrendFeedPage() {
  const [trends, setTrends] = useState<TrendSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get("/api/agency/trends/feed", { params: { limit: 50 } }).then((r) => {
      setTrends(r.data);
    }).finally(() => setLoading(false));
  }, []);

  async function useTrend(trendId: string) {
    setGeneratingId(trendId);
    try {
      const r = await api.post(`/api/agency/trends/use/${trendId}`, null, {
        params: { brandVoiceId: "default" },
      });
      setGeneratedContent((prev) => ({ ...prev, [trendId]: r.data?.post?.content ?? "Content generated!" }));
    } finally {
      setGeneratingId(null);
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
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flame className="size-6 text-orange-500" />
          Trend Feed
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time trending signals relevant to your vertical</p>
      </div>

      {trends.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No active trends found. Trends are refreshed hourly.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {trends.map((t) => (
            <Card key={t.id}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${PLATFORM_COLORS[t.platform] ?? "bg-muted"}`}>
                      {t.platform}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">{t.signalType}</Badge>
                    {t.category && (
                      <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="size-3" />
                    <span>{t.popularity.toLocaleString()}</span>
                    <Zap className="size-3 ml-1" />
                    <span>{t.velocity.toFixed(1)}x</span>
                  </div>
                </div>

                <p className="text-lg font-semibold">{t.value}</p>

                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">
                    Expires: {new Date(t.expiresAt).toLocaleString()}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => useTrend(t.id)}
                    disabled={generatingId === t.id}
                    className="gap-1"
                  >
                    {generatingId === t.id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Sparkles className="size-3" />
                    )}
                    Use This Trend
                  </Button>
                </div>

                {generatedContent[t.id] && (
                  <div className="rounded-md bg-primary/5 border border-primary/10 p-3 mt-2">
                    <p className="text-xs font-medium text-primary/60 mb-1">Generated Post:</p>
                    <p className="text-sm">{generatedContent[t.id]}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
