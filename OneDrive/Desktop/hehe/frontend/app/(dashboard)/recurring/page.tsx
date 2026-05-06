"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformBadge, type Platform } from "@/components/platform-badge";

interface RecurringPost {
  id: string;
  title: string;
  recurrencePattern: string | null;
  nextPublishAt: string | null;
  recurrenceEndAt: string | null;
  platforms: Array<{ platform: Platform }>;
}

function describeCron(cron: string | null) {
  if (!cron) return "Not set";
  if (cron === "0 9 * * *") return "Daily at 9:00";
  if (cron === "0 9 * * 1") return "Weekly on Monday at 9:00";
  if (cron === "0 9 1 * *") return "Monthly on day 1 at 9:00";
  return cron;
}

export default function RecurringPage() {
  const [posts, setPosts] = useState<RecurringPost[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRecurringPosts() {
    setLoading(true);
    try {
      const response = await api.get<{ posts: RecurringPost[] }>("/posts/recurring");
      setPosts(response.data.posts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchRecurringPosts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Recurring posts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your evergreen queue and pause recurring campaigns without losing the post body.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active recurring content</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading recurring posts...</div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No recurring posts yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4">Title</th>
                    <th className="px-4 py-3">Platforms</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3">Next publish</th>
                    <th className="px-4 py-3">End date</th>
                    <th className="pl-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b border-border/60 last:border-b-0">
                      <td className="py-3 pr-4 font-medium">{post.title}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {post.platforms.map((platform) => (
                            <PlatformBadge key={`${post.id}-${platform.platform}`} platform={platform.platform} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">{describeCron(post.recurrencePattern)}</td>
                      <td className="px-4 py-3">{post.nextPublishAt ? new Date(post.nextPublishAt).toLocaleString() : "Not scheduled"}</td>
                      <td className="px-4 py-3">{post.recurrenceEndAt ? new Date(post.recurrenceEndAt).toLocaleDateString() : "No end date"}</td>
                      <td className="pl-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await api.patch(`/posts/${post.id}`, { isRecurring: false });
                              await fetchRecurringPosts();
                            }}
                          >
                            Pause
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            onClick={async () => {
                              if (window.confirm(`Delete ${post.title}?`)) {
                                await api.delete(`/posts/${post.id}`);
                                await fetchRecurringPosts();
                              }
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
