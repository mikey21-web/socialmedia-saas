"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, X, CheckSquare, Square, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformBadge, type Platform } from "@/components/platform-badge";
import { useInboxStore, type InboxPost } from "@/store/inbox";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface BatchResult {
  approved: number;
  failed: number;
  skipped: number;
  errors: Array<{ postId: string; message: string }>;
  warnings: Array<{ postId: string; message: string }>;
}

export default function ApprovalQueuePage() {
  const posts = useInboxStore((s) => s.posts);
  const total = useInboxStore((s) => s.total);
  const loading = useInboxStore((s) => s.loading);
  const stats = useInboxStore((s) => s.stats);
  const fetchInbox = useInboxStore((s) => s.fetchInbox);
  const fetchStats = useInboxStore((s) => s.fetchStats);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchInbox({ status: "awaiting_approval" });
    fetchStats();
  }, [fetchInbox, fetchStats]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selected.size === posts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(posts.map((p) => p.id)));
    }
  }, [posts, selected.size]);

  const handleApproveBatch = async () => {
    if (selected.size === 0) return;
    setProcessing(true);
    try {
      const { data } = await api.post<BatchResult>("/approval/batch", {
        postIds: [...selected],
        action: "approve",
      });
      if (data.approved > 0 || data.skipped > 0) {
        fetchInbox({ status: "awaiting_approval" });
        fetchStats();
        setSelected(new Set());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectBatch = async () => {
    if (selected.size === 0) return;
    setProcessing(true);
    try {
      const { data } = await api.post<BatchResult>("/approval/batch", {
        postIds: [...selected],
        action: "reject",
      });
      if (data.approved > 0 || data.skipped > 0) {
        fetchInbox({ status: "awaiting_approval" });
        fetchStats();
        setSelected(new Set());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Approval Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats ? `${stats.awaiting} posts awaiting approval` : "Loading..."}
          </p>
        </div>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Loading...</Card>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium">No posts awaiting approval</p>
          <p className="text-xs text-muted-foreground mt-1">
            All caught up! Posts will appear here when they need approval.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 py-2 px-1">
            <button
              onClick={selectAll}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {selected.size === posts.length ? (
                <CheckSquare className="size-5" />
              ) : (
                <Square className="size-5" />
              )}
              Select all
            </button>
          </div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              selected={selected.has(post.id)}
              onSelect={() => toggleSelect(post.id)}
            />
          ))}
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handleApproveBatch}
              disabled={processing}
            >
              {processing ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Approve All
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={handleRejectBatch}
              disabled={processing}
            >
              {processing ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
              Reject All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface PostCardProps {
  post: InboxPost;
  selected: boolean;
  onSelect: () => void;
}

function PostCard({ post, selected, onSelect }: PostCardProps) {
  return (
    <Card className={cn("p-4 transition-all hover:border-ring", selected && "border-ring ring-1 ring-ring")}>
      <div className="flex items-start gap-3">
        <button onClick={onSelect} className="mt-1 shrink-0">
          {selected ? (
            <CheckSquare className="size-5 text-primary" />
          ) : (
            <Square className="size-5 text-muted-foreground hover:text-foreground" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate">{post.title || "Untitled post"}</h3>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {post.content}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {post.platforms.map((p) => (
              <PlatformBadge key={p} platform={p as Platform} />
            ))}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}