"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CreditCard, Loader2, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

type SubscriptionStatus = {
  plan: "free" | "pro";
  status: string;
  currentPeriodEnd: string | null;
  seats: number;
  limits: {
    posts: { current: number; max: number };
    platforms: { current: number; max: number };
  };
};

export default function BillingSettingsPage() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<SubscriptionStatus>("/api/subscriptions/status")
      .then((response) => setStatus(response.data))
      .catch(() => setError("Unable to load billing status."))
      .finally(() => setLoading(false));
  }, []);

  async function redirectFrom(endpoint: "/api/subscriptions/checkout" | "/api/subscriptions/portal", nextAction: "checkout" | "portal") {
    setAction(nextAction);
    setError(null);
    try {
      const response = await api.post<{ url: string }>(endpoint);
      window.location.href = response.data.url;
    } catch {
      setError("Unable to open Stripe. Please try again.");
      setAction(null);
    }
  }

  const periodEnd = status?.currentPeriodEnd
    ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(status.currentPeriodEnd))
    : "Not set";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage plan, usage, and Stripe billing.</p>
        </div>
        {status && <Badge variant="outline" className="w-fit capitalize">{status.status.replace("_", " ")}</Badge>}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      <Card className="p-5">
        {loading || !status ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading billing...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Current plan</p>
                <h2 className="mt-1 text-2xl font-semibold">{status.plan === "pro" ? "Pro" : "Free"}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Posts used this month" value={`${status.limits.posts.current}/${status.limits.posts.max}`} />
                <Metric label="Platforms connected" value={`${status.limits.platforms.current}/${status.limits.platforms.max}`} />
                <Metric label="Current period end" value={periodEnd} />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <Button
                onClick={() => redirectFrom("/api/subscriptions/checkout", "checkout")}
                disabled={action !== null || status.plan === "pro"}
                className="h-11 gap-2 md:h-9"
              >
                {action === "checkout" ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                Upgrade to Pro
              </Button>
              {status.plan === "pro" && (
                <Button
                  variant="outline"
                  onClick={() => redirectFrom("/api/subscriptions/portal", "portal")}
                  disabled={action !== null}
                  className="h-11 gap-2 md:h-9"
                >
                  {action === "portal" ? <Loader2 className="size-4 animate-spin" /> : <Settings className="size-4" />}
                  Manage Billing
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
