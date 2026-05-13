"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  Eye,
  FileText,
  Filter,
  Loader2,
  MoreHorizontal,
  PlusCircle,
  Search,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PostModal } from "@/components/post-modal";
import { PlatformBadge } from "@/components/platform-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRow } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { api } from "@/lib/api";
import { type Platform } from "@/store/posts";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  title: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "failed" | "partially_published";
  scheduledAt?: string;
  createdAt: string;
  platforms: Array<{ platform: Platform; status: string }>;
  reach?: number;
  impressions?: number;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  published:           { label: "Published",  className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25" },
  scheduled:           { label: "Scheduled",  className: "bg-amber-500/15 text-amber-500 border-amber-500/25" },
  draft:               { label: "Draft",      className: "bg-muted text-muted-foreground border-border" },
  failed:              { label: "Failed",     className: "bg-destructive/15 text-destructive border-destructive/25" },
  partially_published: { label: "Partial",    className: "bg-orange-500/15 text-orange-500 border-orange-500/25" },
};

const FILTER_TABS = [
  { key: "all",       label: "All" },
  { key: "draft",     label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
  { key: "failed",    label: "Failed" },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]["key"];

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Post[]>("/posts");
      setPosts(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error("Failed to load posts"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filtered = posts.filter((post) => {
    const matchesFilter = filter === "all" || post.status === filter;
    const matchesSearch =
      !search ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.content.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = FILTER_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.key] = tab.key === "all"
      ? posts.length
      : posts.filter((p) => p.status === tab.key).length;
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Posts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {posts.length} post{posts.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <PostModal
          trigger={
            <Button className="gap-2 self-start sm:self-auto">
              <PlusCircle className="size-4" />
              New Post
            </Button>
          }
        />
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                filter === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={cn(
                  "ml-1.5 text-xs px-1.5 py-0.5 rounded-full",
                  filter === tab.key ? "bg-muted text-muted-foreground" : "bg-background/50",
                )}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search posts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonRow count={5} />
      ) : error ? (
        <ErrorState
          title="Could not load posts"
          message={error.message}
          onRetry={fetchPosts}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search ? "No posts match your search" : "No posts yet"}
          description={
            search
              ? "Try a different search term or clear the filter."
              : "Create your first post and schedule it across all your platforms."
          }
          action={
            !search ? (
              <PostModal
                trigger={
                  <Button className="gap-2">
                    <PlusCircle className="size-4" />
                    Create first post
                  </Button>
                }
              />
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((post) => (
            <PostRow key={post.id} post={post} onRefresh={fetchPosts} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostRow({ post, onRefresh }: { post: Post; onRefresh: () => void }) {
  const status = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft;
  const hasMetrics = (post.impressions ?? 0) > 0 || (post.reach ?? 0) > 0;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-ring transition-colors group">
      {/* Platform badges */}
      <div className="flex gap-1 shrink-0">
        {post.platforms.slice(0, 3).map((p) => (
          <PlatformBadge key={p.platform} platform={p.platform} showLabel={false} />
        ))}
        {post.platforms.length > 3 && (
          <span className="text-xs text-muted-foreground self-center">
            +{post.platforms.length - 3}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{post.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {post.content.slice(0, 80)}{post.content.length > 80 ? "…" : ""}
        </p>
      </div>

      {/* Metrics (only when published) */}
      {hasMetrics && (
        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <span className="flex items-center gap-1">
            <Eye className="size-3" />
            {(post.impressions ?? 0).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="size-3" />
            {(post.reach ?? 0).toLocaleString()}
          </span>
        </div>
      )}

      {/* Scheduled date */}
      {post.scheduledAt && post.status === "scheduled" && (
        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Calendar className="size-3" />
          {new Date(post.scheduledAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}

      {/* Status badge */}
      <span
        className={cn(
          "shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
          status.className,
        )}
      >
        {status.label}
      </span>

      {/* Actions (visible on hover) */}
      <button
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
        aria-label="Post options"
      >
        <MoreHorizontal className="size-4 text-muted-foreground" />
      </button>
    </div>
  );
}
