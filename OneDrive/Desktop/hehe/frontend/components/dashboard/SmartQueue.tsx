"use client";
import { useEffect } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformBadge } from "@/components/platform-badge";
import { usePostsStore } from "@/store/posts";
import { selectUpcomingByDay } from "@/store/posts";
import Link from "next/link";

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export function SmartQueue() {
  const posts = usePostsStore((s) => s.posts);
  const loading = usePostsStore((s) => s.loading);
  const fetchPosts = usePostsStore((s) => s.fetchPosts);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (loading) return <Skeleton className="h-64" />;

  const groups = selectUpcomingByDay(posts as Array<{ id: string; status: string; scheduledAt?: string | null; title: string; platform: string }>);

  if (groups.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="mx-auto size-6 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Nothing scheduled</p>
        <p className="text-xs text-muted-foreground mt-1">Queue posts to fill your week.</p>
        <Link href="/posts/new" className="inline-flex mt-3 text-xs underline">Schedule first post</Link>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">Smart Queue</p>
        <Link href="/calendar" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          Calendar <ChevronRight className="size-3" />
        </Link>
      </div>
      <div className="space-y-4">
        {groups.slice(0, 3).map(([day, items]) => (
          <div key={day}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {dayLabel(day)} <span className="font-normal normal-case">· {items.length} post{items.length === 1 ? "" : "s"}</span>
            </p>
            <div className="space-y-1.5">
              {items.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/posts/${p.id}`}
                  className="flex items-center gap-3 rounded-md border border-border p-2.5 hover:border-ring transition-colors"
                >
                  <PlatformBadge platform={p.platform as "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok"} showLabel={false} className="shrink-0" />
                  <p className="flex-1 text-sm truncate">{p.title}</p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(p.scheduledAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
