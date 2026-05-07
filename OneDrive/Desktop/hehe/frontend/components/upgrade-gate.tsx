"use client";

import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

export function UpgradeGate({ feature, limit }: { feature: string; limit: number }) {
  async function upgrade() {
    const response = await api.post<{ url: string }>("/api/subscriptions/checkout");
    window.location.href = response.data.url;
  }

  return (
    <Card className="p-6 text-center">
      <div className="mx-auto flex size-10 items-center justify-center rounded-md bg-muted">
        <LockKeyhole className="size-5 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{feature} is at the Free plan limit</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Free workspaces include {limit}. Upgrade to Pro to keep going without limits.
      </p>
      <Button onClick={upgrade} className="mt-4 h-11 md:h-9">
        Upgrade to Pro
      </Button>
    </Card>
  );
}
