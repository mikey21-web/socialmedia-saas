"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, LinkIcon, Plus, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

const steps = [
  { title: "Set team name", href: "/settings/team", icon: CheckCircle2 },
  { title: "Create first post", href: "/posts/create", icon: Plus },
  { title: "Invite team member", href: "/settings/team", icon: Users },
];

export default function OnboardingPage() {
  const router = useRouter();

  function complete() {
    localStorage.setItem("onboardingComplete", "true");
    router.replace("/dashboard");
  }

  function connect(platform: "twitter" | "linkedin") {
    window.location.href = `${api.defaults.baseURL}/api/platforms/connect/${platform}`;
  }

  return (
    <Card className="p-5">
      <h1 className="text-xl font-semibold">Launch your workspace</h1>
      <div className="mt-5 space-y-3">
        <div className="rounded-md border border-border p-3">
          <p className="text-sm font-medium">Connect first platform</p>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => connect("twitter")} className="h-11 gap-2 md:h-9">
              <X className="size-4" />
              Twitter/X
            </Button>
            <Button variant="outline" onClick={() => connect("linkedin")} className="h-11 gap-2 md:h-9">
              <LinkIcon className="size-4" />
              LinkedIn
            </Button>
          </div>
        </div>
        {steps.map(({ title, href, icon: Icon }) => (
          <Link key={title} href={href} className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-muted/50">
            <span className="flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" />
              {title}
            </span>
            <span className="text-muted-foreground">Open</span>
          </Link>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={complete}>Skip</Button>
        <Button onClick={complete}>Complete</Button>
      </div>
    </Card>
  );
}
