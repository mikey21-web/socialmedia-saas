"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonRow } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Credential {
  id: string;
  platform: string;
  accountId?: string;
  accountName?: string;
  expiresAt?: string;
  status: "connected" | "expired";
  createdAt: string;
}

const PLATFORM_META: Record<string, { label: string; color: string; emoji: string }> = {
  x:         { label: "X (Twitter)",  color: "bg-black text-white",                emoji: "𝕏" },
  twitter:   { label: "X (Twitter)",  color: "bg-black text-white",                emoji: "𝕏" },
  instagram: { label: "Instagram",    color: "bg-gradient-to-br from-purple-500 to-pink-500 text-white", emoji: "📷" },
  linkedin:  { label: "LinkedIn",     color: "bg-blue-600 text-white",              emoji: "in" },
  facebook:  { label: "Facebook",     color: "bg-blue-500 text-white",              emoji: "f" },
  tiktok:    { label: "TikTok",       color: "bg-black text-white",                emoji: "♪" },
  youtube:   { label: "YouTube",      color: "bg-red-600 text-white",               emoji: "▶" },
};

const CONNECTABLE_PLATFORMS = ["x", "instagram", "linkedin", "facebook", "tiktok", "youtube"];

function ConnectionsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const oauthError = searchParams.get("error");
    if (connected === "true") {
      setBanner({ type: "success", message: "Account connected successfully." });
      router.replace("/settings/connections");
    } else if (oauthError) {
      setBanner({ type: "error", message: decodeURIComponent(oauthError) });
      router.replace("/settings/connections");
    }
  }, [searchParams, router]);

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Credential[]>("/platforms/credentials");
      setCredentials(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error("Failed to load connections"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (platform: string) => {
    setConnecting(platform);
    try {
      const res = await api.get<{ url: string }>(`/oauth/${platform}/url`);
      window.location.href = res.data.url;
    } catch {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (credentialId: string) => {
    if (!confirm("Disconnect this account? Scheduled posts using it will fail.")) return;
    setDeleting(credentialId);
    try {
      await api.delete(`/platforms/credentials/${credentialId}`);
      setCredentials((prev) => prev.filter((c) => c.id !== credentialId));
    } finally {
      setDeleting(null);
    }
  };

  const handleRefreshToken = async (credentialId: string) => {
    setRefreshing(credentialId);
    try {
      await api.post(`/platforms/credentials/${credentialId}/refresh`);
      await fetchCredentials();
    } finally {
      setRefreshing(null);
    }
  };

  const connectedPlatforms = new Set(credentials.map((c) => c.platform));
  const unconnectedPlatforms = CONNECTABLE_PLATFORMS.filter((p) => !connectedPlatforms.has(p));

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Platform Connections</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connect your social accounts to start publishing
        </p>
      </div>

      {banner && (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm",
            banner.type === "success"
              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/25"
              : "bg-red-500/15 text-red-600 border border-red-500/25",
          )}
        >
          {banner.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          {banner.message}
        </div>
      )}

      {loading ? (
        <SkeletonRow count={4} />
      ) : error ? (
        <ErrorState
          title="Could not load connections"
          message={error.message}
          onRetry={fetchCredentials}
        />
      ) : (
        <>
          {/* Connected accounts */}
          {credentials.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Connected ({credentials.length})
              </p>
              {credentials.map((cred) => {
                const meta = PLATFORM_META[cred.platform] ?? {
                  label: cred.platform,
                  color: "bg-muted text-foreground",
                  emoji: "?",
                };
                const isExpired = cred.status === "expired";

                return (
                  <Card key={cred.id} className={cn(isExpired && "border-amber-500/40")}>
                    <CardContent className="py-3 flex items-center gap-3">
                      {/* Platform icon */}
                      <div
                        className={cn(
                          "size-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                          meta.color,
                        )}
                      >
                        {meta.emoji}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{meta.label}</p>
                          {isExpired ? (
                            <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/25 border text-[10px] px-1.5 py-0 gap-1">
                              <AlertCircle className="size-2.5" />
                              Expired
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/25 border text-[10px] px-1.5 py-0 gap-1">
                              <CheckCircle2 className="size-2.5" />
                              Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {cred.accountName ?? cred.accountId ?? "Unknown account"}
                        </p>
                        {cred.expiresAt && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="size-2.5" />
                            {isExpired ? "Expired" : "Expires"}{" "}
                            {new Date(cred.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isExpired && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRefreshToken(cred.id)}
                            disabled={refreshing === cred.id}
                            className="gap-1 text-xs h-8"
                          >
                            {refreshing === cred.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <RefreshCw className="size-3" />
                            )}
                            Reconnect
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDisconnect(cred.id)}
                          disabled={deleting === cred.id}
                          className="size-8 text-muted-foreground hover:text-destructive"
                          aria-label="Disconnect"
                        >
                          {deleting === cred.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Add more platforms */}
          {unconnectedPlatforms.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Add Platform
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {unconnectedPlatforms.map((platform) => {
                  const meta = PLATFORM_META[platform] ?? {
                    label: platform,
                    color: "bg-muted text-foreground",
                    emoji: "?",
                  };
                  return (
                    <button
                      key={platform}
                      onClick={() => handleConnect(platform)}
                      disabled={connecting === platform}
                      className="flex items-center gap-2.5 p-3 rounded-lg border border-border hover:border-ring hover:bg-muted/50 transition-colors text-left group disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <div
                        className={cn(
                          "size-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0",
                          meta.color,
                        )}
                      >
                        {meta.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{meta.label}</p>
                      </div>
                      {connecting === platform ? (
                        <Loader2 className="size-3.5 text-muted-foreground ml-auto shrink-0 animate-spin" />
                      ) : (
                        <Plus className="size-3.5 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {credentials.length === 0 && unconnectedPlatforms.length === 0 && (
            <EmptyState
              icon={Link2}
              title="No platforms available"
              description="All supported platforms are already connected."
            />
          )}
        </>
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={null}>
      <ConnectionsPageInner />
    </Suspense>
  );
}
