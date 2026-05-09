"use client";

import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "boneyard-js/react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw, ArrowRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformBadge, type Platform } from "@/components/platform-badge";
import { api } from "@/lib/api";

interface Recommendation {
  id: string;
  caption: string;
  platforms: string[];
  reasoning: string;
  trendKeyword?: string;
  relatedPostTitle?: string;
}

interface RecommendationsResponse {
  recommendations: Recommendation[];
  cached: boolean;
  stale: boolean;
}

function SkeletonCard() {
  return (
    <Card size="sm">
      <CardContent>
        <div className="h-20 bg-muted rounded animate-pulse" />
        <div className="flex gap-2 mt-3">
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
      </CardFooter>
    </Card>
  );
}

export default function RecommendationsPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const { data } = await api.get<RecommendationsResponse>("/recommendations");
      setRecommendations(data.recommendations);
      setStale(data.stale);
    } catch (err) {
      setError("Failed to load recommendations. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleRefresh = () => {
    fetchRecommendations(true);
  };

  const handleUseRecommendation = async (rec: Recommendation) => {
    try {
      await api.post("/posts", {
        title: rec.caption.slice(0, 80),
        content: rec.caption,
        platforms: rec.platforms,
        status: "draft",
      });
      router.push("/posts");
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  return (
    <Skeleton name="recommendations-page" loading={loading}>
      <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="size-5 text-primary" />
          <h1 className="text-xl font-semibold">Content Ideas</h1>
          {stale && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              <AlertCircle className="size-3" />
              May be outdated
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Generating..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles className="size-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No recommendations yet</p>
          <p className="text-sm mt-1">Click refresh to generate personalized content ideas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} size="sm">
              <CardContent>
                <p className="text-sm leading-relaxed">{rec.caption}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {rec.platforms.map((platform) => (
                    <PlatformBadge
                      key={platform}
                      platform={platform as Platform}
                      showLabel={true}
                    />
                  ))}
                  {rec.trendKeyword && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      <Sparkles className="size-3" />
                      {rec.trendKeyword}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex items-center justify-between w-full">
                  <p className="text-xs text-muted-foreground flex-1">{rec.reasoning}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUseRecommendation(rec)}
                    className="ml-2 shrink-0"
                  >
                    Use this
                    <ArrowRight className="size-3" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      </div>
    </Skeleton>
  );
}
