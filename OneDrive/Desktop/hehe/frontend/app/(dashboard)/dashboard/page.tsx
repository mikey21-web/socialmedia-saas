"use client";

import { useEffect } from "react";
import { FileText, MousePointerClick, PlusCircle, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PostModal } from "@/components/post-modal";
import { PlatformBadge } from "@/components/platform-badge";
import { usePostsStore } from "@/store/posts";
import { cn } from "@/lib/utils";
import { GoalProgressCard } from "@/components/agent/GoalProgressCard";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  scheduled: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  draft: "bg-muted text-muted-foreground border-border",
};

export default function DashboardPage() {
  const posts = usePostsStore((s) => s.posts);
  const loading = usePostsStore((s) => s.loading);
  const fetchPosts = usePostsStore((s) => s.fetchPosts);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const postsPublished = posts.filter((post) => post.status === "published").length;
  const postsScheduled = posts.filter((post) => post.status === "scheduled").length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your recent publishing activity.
          </p>
        </div>
        <PostModal />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Posts Created</p>
          <p className="text-2xl font-semibold">{posts.length}</p>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Published</p>
            <TrendingUp className="size-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-semibold">{postsPublished}</p>
        </Card>
        <Card className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Scheduled</p>
          <p className="text-2xl font-semibold">{postsScheduled}</p>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Engagement Actions</p>
            <MousePointerClick className="size-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold">--</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {loading ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">Loading dashboard...</Card>
          ) : posts.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                <FileText className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No posts yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start by creating your first post.
              </p>
              <div className="mt-4 inline-flex">
                <PostModal
                  trigger={
                    <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground h-11 md:h-9">
                      <PlusCircle className="size-4" />
                      Create first post
                    </button>
                  }
                />
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-medium">Recent Posts</h2>
              <div className="space-y-2">
                {posts.slice(0, 8).map((post) => (
                  <div
                    key={`${post.id}-${post.platform}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-ring transition-colors"
                  >
                    <PlatformBadge platform={post.platform} showLabel={false} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{post.time}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
                        STATUS_STYLES[post.status],
                      )}
                    >
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <GoalProgressCard />
        </div>
      </div>
    </div>
  );
}
