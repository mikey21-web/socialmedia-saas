"use client";

import { useEffect, useState } from "react";
import { Kanban, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface PipelinePost {
  id: string;
  title: string | null;
  content: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  platforms: { platform: string }[];
  impressions: number;
}

const COLUMNS = [
  { key: "draft", label: "Generated", color: "border-blue-500/50" },
  { key: "approved", label: "Approved", color: "border-green-500/50" },
  { key: "scheduled", label: "Scheduled", color: "border-yellow-500/50" },
  { key: "published", label: "Published", color: "border-emerald-500/50" },
];

export default function PipelinePage() {
  const [posts, setPosts] = useState<PipelinePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/posts", { params: { limit: 200 } }).then((r) => {
      setPosts(Array.isArray(r.data) ? r.data : r.data.posts ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const grouped = COLUMNS.map((col) => ({
    ...col,
    posts: posts.filter((p) => p.status === col.key),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Kanban className="size-6 text-indigo-500" />
          Content Pipeline
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Track your content from creation to performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[60vh]">
        {grouped.map((col) => (
          <div key={col.key} className="space-y-3">
            <div className={`flex items-center justify-between border-b-2 ${col.color} pb-2`}>
              <h3 className="font-semibold text-sm">{col.label}</h3>
              <Badge variant="secondary" className="text-xs">{col.posts.length}</Badge>
            </div>
            <div className="space-y-2">
              {col.posts.map((post) => (
                <Card key={post.id} className="cursor-pointer hover:border-muted-foreground/30 transition-colors">
                  <CardContent className="pt-3 pb-3 space-y-2">
                    <p className="text-sm font-medium line-clamp-2">
                      {post.title || post.content.slice(0, 80)}
                    </p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {post.platforms?.map((pp) => (
                        <Badge key={pp.platform} variant="outline" className="text-[10px] capitalize">
                          {pp.platform}
                        </Badge>
                      ))}
                    </div>
                    {post.scheduledAt && (
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(post.scheduledAt).toLocaleString()}
                      </p>
                    )}
                    {post.status === "published" && post.impressions > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {post.impressions.toLocaleString()} impressions
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {col.posts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No posts</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
