"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type SubscriptionStatus = {
  plan: "free" | "pro";
  limits: { posts: { current: number; max: number } };
};

export function UpgradeBanner() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("upgradeBannerDismissed") === "true") return;
    api.get<SubscriptionStatus>("/api/subscriptions/status").then((response) => {
      const posts = response.data.limits.posts;
      if (response.data.plan === "free" && posts.current / posts.max >= 0.8) {
        setRemaining(Math.max(posts.max - posts.current, 0));
      }
    }).catch(() => undefined);
  }, []);

  if (remaining === null) return null;

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-primary px-4 py-2 text-sm text-primary-foreground">
      <span>{remaining} posts remaining on Free — Upgrade to Pro</span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            const response = await api.post<{ url: string }>("/api/subscriptions/checkout");
            window.location.href = response.data.url;
          }}
        >
          Upgrade
        </Button>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-md hover:bg-primary-foreground/10"
          onClick={() => {
            sessionStorage.setItem("upgradeBannerDismissed", "true");
            setRemaining(null);
          }}
          aria-label="Dismiss upgrade banner"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
