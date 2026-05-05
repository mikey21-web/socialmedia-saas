"use client";

import { useState, useEffect } from "react";
import { FileText, RotateCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PostModal } from "@/components/post-modal";
import { PlatformBadge } from "@/components/platform-badge";
import { usePostsStore } from "@/store/posts";
import { cn } from "@/lib/utils";

type Status = "all" | "scheduled" | "published" | "draft";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  scheduled: "bg-amber-500/15  text-amber-400  border-amber-500/25",
  draft:     "bg-muted          text-muted-foreground border-border",
};

export default function PostsPage() {
  const [tab, setTab] = useState<Status>("all");
  const posts = usePostsStore((s) => s.posts);
  const loading = usePostsStore((s) => s.loading);
  const error = usePostsStore((s) => s.error);
  const fetchPosts = usePostsStore((s) => s.fetchPosts);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filtered = posts.filter((p) => tab === "all" || p.status === tab);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Posts</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage your content</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPosts()}
            disabled={loading}
            className="gap-1.5 h-11 md:h-7 w-full sm:w-auto"
          >
            <RotateCw className={cn("size-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
          <PostModal onSuccess={() => fetchPosts()} />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList className="h-11 md:h-8 w-full sm:w-auto overflow-x-auto">
          {(["all", "scheduled", "published", "draft"] as Status[]).map((t) => (
            <TabsTrigger key={t} value={t} className="text-xs px-3 capitalize flex-1 sm:flex-none">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading && posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading posts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center">
            <FileText className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No posts here</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create your first post to get started.
            </p>
          </div>
          <PostModal onSuccess={() => fetchPosts()} />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3.5 hover:border-ring transition-colors cursor-pointer"
            >
              <PlatformBadge platform={post.platform} showLabel={false} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{post.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <PlatformBadge platform={post.platform} className="text-[10px] py-0" />
                  <span className="text-xs text-muted-foreground">{post.time}</span>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
                  STATUS_STYLES[post.status]
                )}
              >
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
