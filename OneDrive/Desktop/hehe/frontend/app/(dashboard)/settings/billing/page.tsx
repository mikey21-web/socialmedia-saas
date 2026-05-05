"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

type Plan = "free" | "pro";

const TIERS: Array<{
  key: Plan;
  title: string;
  price: string;
  subtitle: string;
  features: string[];
}> = [
  {
    key: "free",
    title: "Free",
    price: "$0/mo",
    subtitle: "Best to get started",
    features: ["1 post/day", "Basic scheduling", "Single workspace"],
  },
  {
    key: "pro",
    title: "Pro",
    price: "$19/mo",
    subtitle: "For serious growth",
    features: ["Unlimited posts", "Advanced analytics", "Team collaboration"],
  },
];

export default function BillingSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeStatus = params.get("stripe");
    if (stripeStatus === "success") {
      setSuccessMessage("Billing updated successfully.");
      setPlan("pro");
    } else if (stripeStatus === "cancel") {
      setError("Checkout canceled. No charges were made.");
    }
  }, []);

  const currentLabel = useMemo(() => (plan === "pro" ? "Pro" : "Free"), [plan]);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await api.post<{ url?: string }>("/subscriptions/checkout");
      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }
      setError("Checkout session could not be created.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start checkout";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your subscription and upgrade when you&apos;re ready.
          </p>
        </div>
        <Badge variant="outline" className="h-8 px-3 text-xs w-fit">
          Current Plan: {currentLabel}
        </Badge>
      </div>

      {successMessage && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {TIERS.map((tier) => (
          <Card
            key={tier.key}
            className={`p-5 space-y-4 ${plan === tier.key ? "border-primary/50" : ""}`}
          >
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{tier.subtitle}</p>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{tier.title}</h2>
                <p className="text-sm font-medium">{tier.price}</p>
              </div>
            </div>

            <ul className="space-y-2">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>

            {tier.key === "pro" ? (
              <Button
                onClick={handleCheckout}
                disabled={loading || plan === "pro"}
                className="w-full h-11 md:h-9 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Starting checkout...
                  </>
                ) : (
                  <>
                    <CreditCard className="size-4" />
                    {plan === "pro" ? "You are on Pro" : "Upgrade to Pro"}
                  </>
                )}
              </Button>
            ) : (
              <Button variant="outline" disabled className="w-full h-11 md:h-9">
                Current Free plan
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
