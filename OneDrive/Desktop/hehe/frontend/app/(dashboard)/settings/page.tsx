"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CreditCard, Loader2, Music2, PenLine, PlaySquare, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const sections = [
  {
    href: "/settings/billing",
    title: "Billing",
    description: "View plans, pricing and subscription status.",
    icon: CreditCard,
    iconClassName: "text-muted-foreground",
  },
  {
    href: "/settings/team",
    title: "Team",
    description: "Manage team members and invitations.",
    icon: Users,
    iconClassName: "text-muted-foreground",
  },
  {
    href: "/settings/signature",
    title: "Signature",
    description: "Set an auto-appended team signature for posts.",
    icon: PenLine,
    iconClassName: "text-muted-foreground",
  },
];

const platformConnectors = [
  {
    id: "youtube",
    title: "YouTube",
    description: "Connect your YouTube channel for publishing and analytics.",
    icon: PlaySquare,
    iconClassName: "text-red-400",
    platform: "youtube",
  },
  {
    id: "tiktok",
    title: "TikTok",
    description: "Connect TikTok to publish videos and collect performance data.",
    icon: Music2,
    iconClassName: "text-white",
    platform: "tiktok",
  },
] as const;

export default function SettingsIndexPage() {
  const [connecting, setConnecting] = useState<string | null>(null);

  async function connectPlatform(platform: string) {
    setConnecting(platform);
    try {
      const response = await api.get<{ url: string }>(`/oauth/${platform}/url`);
      window.location.assign(response.data.url);
    } finally {
      setConnecting(null);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a section to manage your workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sections.map(({ href, title, description, icon: Icon, iconClassName }) => (
          <Link key={href} href={href}>
            <Card className="h-full p-5 transition-colors hover:border-ring">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`size-4 ${iconClassName}`} />
                    <p className="text-sm font-semibold">{title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {platformConnectors.map(({ id, title, description, icon: Icon, iconClassName, platform }) => (
          <Card key={id} id={id} className="space-y-4 p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Icon className={`size-4 ${iconClassName}`} />
                <p className="text-sm font-semibold">{title}</p>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Button type="button" variant="outline" onClick={() => void connectPlatform(platform)} disabled={connecting === platform}>
              {connecting === platform ? <Loader2 className="size-4 animate-spin" /> : null}
              Connect {title}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
