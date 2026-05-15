"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Search,
  TrendingUp,
  Trash2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PostModal } from "@/components/post-modal";
import { PlatformBadge } from "@/components/platform-badge";
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

const STATUS_BAR: Record<Post["status"], string> = {
  draft:               "bg-zinc-500",
  scheduled:           "bg-violet-500",
  published:           "bg-emerald-500",
  failed:              "bg-red-500",
  partially_published: "bg-amber-500",
};

const STATUS_LABEL: Record<Post["status"], string> = {
  draft:               "Draft",
  scheduled:           "Scheduled",
  published:           "Published",
  failed:              "Failed",
  partially_published: "Partial",
};

const STATUS_DOT: Record<Post["status"], string> = {
  draft:               "bg-zinc-500",
  scheduled:           "bg-violet-500",
  published:           "bg-emerald-500",
  failed:              "bg-red-500",
  partially_published: "bg-amber-500",
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

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">Posts</h1>
          <span className="text-xs text-muted-foreground">
            {posts.length} total
          </span>
        </div>
        <PostModal
          trigger={
            <Button size="sm" className="gap-1.5">
              <PlusCircle className="size-3.5" />
              New post
            </Button>
          }
          onSuccess={fetchPosts}
        />
      </div>

      {/* Tab bar with counts */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border shrink-0">
        <div className="flex gap-1 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5",
                filter === tab.key
                  ? "bg-violet-500/10 text-violet-400 border border-violet-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent",
              )}
            >
              {tab.key !== "all" && (
                <span className={cn("size-1.5 rounded-full", STATUS_DOT[tab.key as Post["status"]])} />
              )}
              {tab.label}
              <span className={cn(
                "text-[10px] tabular-nums",
                filter === tab.key ? "text-violet-300" : "text-muted-foreground/60",
              )}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-56 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <SkeletonRow count={6} />
        ) : error ? (
          <ErrorState
            title="Could not load posts"
            message={error.message}
            onRetry={fetchPosts}
          />
        ) : filtered.length === 0 ? (
          <EmptyPosts search={search} onClear={() => setSearch("")} onRefresh={fetchPosts} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const time = post.scheduledAt
    ? new Date(post.scheduledAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date(post.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

  const hasMetrics =
    post.status === "published" &&
    ((post.impressions ?? 0) > 0 || (post.reach ?? 0) > 0);

  const primary = post.platforms[0]?.platform;
  const extra = post.platforms.length > 1 ? post.platforms.length - 1 : 0;

  return (
    <div className="group rounded-lg overflow-hidden border border-border bg-card hover:border-ring transition-all">
      {/* Colored header bar */}
      <div className={cn("h-7 px-2.5 flex items-center justify-between", STATUS_BAR[post.status])}>
        <div className="flex items-center gap-1.5 min-w-0">
          {primary && <PlatformBadge platform={primary} showLabel={false} className="scale-75 -ml-0.5" />}
          {extra > 0 && (
            <span className="text-[10px] font-medium text-white/90">+{extra}</span>
          )}
          <span className="text-[10px] font-medium text-white/90 ml-1 inline-flex items-center gap-1">
            <Clock className="size-2.5" />
            {time}
          </span>
        </div>
        <div className="hidden group-hover:flex items-center gap-0.5">
          <Link
            href={`/posts/${post.id}`}
            className="size-5 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-white/20"
            aria-label="Edit post"
          >
            <Pencil className="size-3" />
          </Link>
          <button
            className="size-5 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-white/20"
            aria-label="More actions"
          >
            <MoreHorizontal className="size-3" />
          </button>
        </div>
      </div>

      {/* Body */}
      <Link href={`/posts/${post.id}`} className="block p-3 space-y-2">
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {post.title || "Untitled post"}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-3">
          {post.content}
        </p>

        {/* Footer row — status pill + metrics */}
        <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-border/50">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium">
            <span className={cn("size-1.5 rounded-full", STATUS_DOT[post.status])} />
            <span className="text-muted-foreground">{STATUS_LABEL[post.status]}</span>
          </span>
          {hasMetrics && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Eye className="size-2.5" />
                {(post.impressions ?? 0).toLocaleString()}
              </span>
              <span className="flex items-center gap-0.5">
                <TrendingUp className="size-2.5" />
                {(post.reach ?? 0).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

function EmptyPosts({
  search,
  onClear,
  onRefresh,
}: {
  search: string;
  onClear: () => void;
  onRefresh: () => void;
}) {
  if (search) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Search className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No posts match &quot;{search}&quot;</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">Try a different keyword.</p>
        <Button variant="outline" size="sm" onClick={onClear}>Clear search</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
      <div className="size-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
        <FileText className="size-7 text-white" />
      </div>
      <h2 className="text-base font-semibold">Start posting smarter</h2>
      <p className="text-xs text-muted-foreground mt-1.5 mb-4 max-w-xs">
        Draft once, schedule everywhere. Brain will help write, time, and approve.
      </p>
      <div className="flex items-center gap-2">
        <PostModal
          trigger={
            <Button size="sm" className="gap-1.5">
              <PlusCircle className="size-3.5" />
              Create first post
            </Button>
          }
          onSuccess={onRefresh}
        />
        <Link
          href="/calendar"
          className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
        >
          <Calendar className="size-3.5" />
          See calendar
        </Link>
      </div>
    </div>
  );
}
