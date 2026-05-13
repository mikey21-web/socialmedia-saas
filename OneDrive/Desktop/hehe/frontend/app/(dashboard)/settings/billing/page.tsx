"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonRow } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SubscriptionStatus {
  plan: string;
  agencyTier: string;
  status: string;
  currentPeriodEnd?: string;
  renewalDate?: string;
  seats: number;
  limits: {
    posts?: { current: number; max: number | null };
    platforms?: { current: number; max: number | null };
    members?: { current: number; max: number | null };
    aiRuns?: { current: number; max: number | null };
    carousels?: { current: number; max: number | null };
  };
}

interface Plan {
  id: string;
  name: string;
  priceInr: number;
  limits: Record<string, unknown>;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  active:   { label: "Active",   className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25", icon: CheckCircle2 },
  trialing: { label: "Trial",    className: "bg-blue-500/15 text-blue-500 border-blue-500/25",          icon: Sparkles },
  past_due: { label: "Past Due", className: "bg-amber-500/15 text-amber-500 border-amber-500/25",       icon: AlertCircle },
  canceled: { label: "Canceled", className: "bg-muted text-muted-foreground border-border",             icon: AlertCircle },
  disputed: { label: "Disputed", className: "bg-destructive/15 text-destructive border-destructive/25", icon: AlertCircle },
};

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  free:       ["2 platforms", "30 posts/month", "Basic analytics"],
  solo:       ["2 platforms", "30 posts/month", "1 brand voice", "5 carousels/month"],
  pro:        ["5 platforms", "90 posts/month", "3 brand voices", "20 carousels/month", "Competitor tracking"],
  agency:     ["5 platforms", "300 posts/month", "10 brand voices", "60 carousels/month", "White-label portals", "5 client accounts"],
  enterprise: ["Unlimited everything", "Dedicated support", "4-hour SLA", "Custom integrations"],
};

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, plansRes] = await Promise.all([
        api.get<SubscriptionStatus>("/subscriptions/status"),
        api.get<Plan[]>("/subscriptions/plans"),
      ]);
      setSubscription(subRes.data);
      setPlans(plansRes.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error("Failed to load billing info"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpgrade = async (tier: string) => {
    setUpgrading(tier);
    try {
      const res = await api.post<{ url: string }>("/subscriptions/checkout", { tier });
      window.location.href = res.data.url;
    } catch {
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    setOpeningPortal(true);
    try {
      const res = await api.post<{ url: string }>("/subscriptions/portal");
      window.open(res.data.url, "_blank");
    } finally {
      setOpeningPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold">Billing</h1>
        <SkeletonRow count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold">Billing</h1>
        <ErrorState title="Could not load billing info" message={error.message} onRetry={fetchData} />
      </div>
    );
  }

  const currentPlan = subscription?.agencyTier ?? subscription?.plan ?? "free";
  const statusKey = subscription?.status ?? "active";
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.active;
  const StatusIcon = statusCfg.icon;
  const isPaid = currentPlan !== "free" && currentPlan !== "solo";
  const renewalDate = subscription?.renewalDate ?? subscription?.currentPeriodEnd;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your plan and payment details</p>
      </div>

      {/* Current plan card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Current Plan</CardTitle>
            <Badge
              className={cn(
                "inline-flex items-center gap-1 border text-xs font-medium px-2 py-0.5",
                statusCfg.className,
              )}
            >
              <StatusIcon className="size-3" />
              {statusCfg.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold capitalize">{currentPlan}</p>
              {renewalDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  Renews {new Date(renewalDate).toLocaleDateString(undefined, {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              )}
            </div>
            {isPaid && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageBilling}
                disabled={openingPortal}
                className="gap-2"
              >
                {openingPortal ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <ExternalLink className="size-3" />
                )}
                Manage billing
              </Button>
            )}
          </div>

          {/* Usage bars */}
          {subscription?.limits && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              {Object.entries(subscription.limits).map(([key, usage]) => {
                if (!usage || typeof usage !== "object") return null;
                const { current, max } = usage as { current: number; max: number | null };
                const pct = max ? Math.min((current / max) * 100, 100) : 0;
                const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">
                        {current}{max ? ` / ${max}` : ""}
                      </span>
                    </div>
                    {max && (
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-amber-500" : "bg-primary",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade options */}
      {plans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Available Plans
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {plans
              .filter((p) => p.id !== currentPlan)
              .map((plan) => {
                const highlights = PLAN_HIGHLIGHTS[plan.id] ?? [];
                const isPopular = plan.id === "pro";
                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "relative overflow-hidden transition-colors",
                      isPopular && "border-primary/50",
                    )}
                  >
                    {isPopular && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl">
                        POPULAR
                      </div>
                    )}
                    <CardContent className="pt-4 pb-4 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <p className="font-semibold capitalize">{plan.name}</p>
                        <p className="text-sm font-bold">
                          ₹{plan.priceInr.toLocaleString()}
                          <span className="text-xs font-normal text-muted-foreground">/mo</span>
                        </p>
                      </div>
                      <ul className="space-y-1">
                        {highlights.map((h) => (
                          <li key={h} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                      <Button
                        size="sm"
                        className="w-full gap-2"
                        variant={isPopular ? "default" : "outline"}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={upgrading === plan.id}
                      >
                        {upgrading === plan.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Zap className="size-3" />
                        )}
                        Upgrade to {plan.name}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Payment method note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CreditCard className="size-3.5 shrink-0" />
        Payments are processed securely by Stripe. We never store your card details.
      </div>
    </div>
  );
}
