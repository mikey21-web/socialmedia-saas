"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, X, Loader2, Calendar, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PortalData {
  clientName: string;
  brandColor: string;
  clientLogo?: string;
  permissions: { viewPosts: boolean; approvePosts: boolean; viewAnalytics: boolean };
  posts?: Array<{
    id: string;
    title: string;
    content: string;
    status: string;
    scheduledAt?: string;
    mediaUrls: string[];
    platforms: Array<{ platform: string; status: string }>;
  }>;
  analytics?: { totalImpressions: number; totalEngagements: number; period: string };
}

export default function ClientPortalPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agency/clients/portal/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject("Portal not found"))
      .then(setData)
      .catch(() => setError("This portal link is invalid or has been deactivated."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAction(postId: string, action: "approve" | "reject") {
    setActionLoading(postId);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agency/clients/portal/${token}/posts/${postId}/${action}`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );
      // Refresh data
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agency/clients/portal/${token}`);
      setData(await res.json());
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <p className="text-sm text-destructive">{error ?? "Something went wrong"}</p>
        </Card>
      </div>
    );
  }

  const pendingPosts = data.posts?.filter(p => p.status === "draft" || p.status === "awaiting_approval") ?? [];
  const publishedPosts = data.posts?.filter(p => p.status === "published" || p.status === "approved") ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: data.brandColor + "33" }}>
        <div className="flex items-center gap-3">
          {data.clientLogo && <img src={data.clientLogo} alt="" className="h-8 w-8 rounded" />}
          <h1 className="text-lg font-semibold">{data.clientName}</h1>
        </div>
        <span className="text-xs text-muted-foreground">Content Portal</span>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Analytics Summary */}
        {data.permissions.viewAnalytics && data.analytics && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BarChart2 className="size-3" /> Impressions ({data.analytics.period})
                </div>
                <p className="text-2xl font-bold mt-1">{data.analytics.totalImpressions.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BarChart2 className="size-3" /> Engagements ({data.analytics.period})
                </div>
                <p className="text-2xl font-bold mt-1">{data.analytics.totalEngagements.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pending Approval */}
        {data.permissions.approvePosts && pendingPosts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Awaiting Your Approval ({pendingPosts.length})</h2>
            {pendingPosts.map(post => (
              <Card key={post.id} className="overflow-hidden">
                <CardContent className="py-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium">{post.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {post.content.slice(0, 300)}{post.content.length > 300 ? "..." : ""}
                    </p>
                  </div>
                  {post.mediaUrls.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {(post.mediaUrls as string[]).slice(0, 4).map((url, i) => (
                        <img key={i} src={url} alt="" className="h-20 w-20 object-cover rounded border" />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {post.platforms.map(p => (
                        <span key={p.platform} className="text-[10px] px-2 py-0.5 rounded-full bg-muted">
                          {p.platform}
                        </span>
                      ))}
                      {post.scheduledAt && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted flex items-center gap-1">
                          <Calendar className="size-2.5" />
                          {new Date(post.scheduledAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleAction(post.id, "reject")}
                        disabled={actionLoading === post.id}
                      >
                        <X className="size-3 mr-1" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(post.id, "approve")}
                        disabled={actionLoading === post.id}
                        style={{ backgroundColor: data.brandColor }}
                      >
                        {actionLoading === post.id ? (
                          <Loader2 className="size-3 animate-spin mr-1" />
                        ) : (
                          <Check className="size-3 mr-1" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Published Posts */}
        {data.permissions.viewPosts && publishedPosts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Published ({publishedPosts.length})</h2>
            {publishedPosts.slice(0, 10).map(post => (
              <Card key={post.id}>
                <CardContent className="py-3">
                  <p className="text-sm font-medium">{post.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{post.content.slice(0, 100)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
