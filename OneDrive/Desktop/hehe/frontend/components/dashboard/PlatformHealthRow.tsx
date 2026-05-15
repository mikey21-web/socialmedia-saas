// frontend/components/dashboard/PlatformHealthRow.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Credential {
  id: string;
  platform: string;
  accountName?: string;
  expiresAt?: string;
  status: "connected" | "expired";
}

const PLATFORM_META: Record<string, { label: string; color: string; emoji: string }> = {
  x:         { label: "X",        color: "bg-black text-white",                                                   emoji: "𝕏" },
  instagram: { label: "Instagram",color: "bg-gradient-to-br from-purple-500 to-pink-500 text-white",              emoji: "📷" },
  linkedin:  { label: "LinkedIn", color: "bg-blue-600 text-white",                                                emoji: "in" },
  facebook:  { label: "Facebook", color: "bg-blue-500 text-white",                                                emoji: "f" },
  tiktok:    { label: "TikTok",   color: "bg-black text-white",                                                   emoji: "♪" },
  youtube:   { label: "YouTube",  color: "bg-red-600 text-white",                                                 emoji: "▶" },
};

export function PlatformHealthRow() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCreds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Credential[]>("/platforms/credentials");
      setCredentials(res.data);
    } catch {
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreds();
  }, [fetchCreds]);

  if (loading) {
    return <Skeleton className="h-24" />;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">Platform Health</p>
        <Link href="/settings/connections" className="text-xs text-muted-foreground hover:text-foreground">Manage</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {credentials.map((cred) => {
          const meta = PLATFORM_META[cred.platform] ?? { label: cred.platform, color: "bg-muted text-foreground", emoji: "?" };
          const expired = cred.status === "expired";
          return (
            <div key={cred.id} className={cn("min-w-[180px] flex items-center gap-3 px-3 py-2 rounded-lg border", expired ? "border-amber-500/40" : "border-border")}>
              <div className={cn("size-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0", meta.color)}>
                {meta.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{meta.label}</p>
                <p className="text-xs text-muted-foreground truncate">{cred.accountName ?? "—"}</p>
              </div>
              {expired ? (
                <AlertCircle className="size-3.5 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              )}
            </div>
          );
        })}
        <Link
          href="/settings/connections"
          className="min-w-[140px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-ring hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Connect more
        </Link>
      </div>
    </Card>
  );
}
