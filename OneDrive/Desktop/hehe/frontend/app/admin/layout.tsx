"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { Activity, Database, Flag, KeyRound, LifeBuoy, Mail, Server, Shield, Timer, Users, Webhook } from "lucide-react";
import { useAuthStore } from "@/store/auth";

const nav = [
  { href: "/admin", label: "Overview", icon: Activity },
  { href: "/admin/analytics", label: "Analytics", icon: Activity },
  { href: "/admin/health", label: "Health", icon: Server },
  { href: "/admin/feature-flags", label: "Flags", icon: Flag },
  { href: "/admin/api-usage", label: "API Usage", icon: Timer },
  { href: "/admin/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/admin/audit", label: "Audit", icon: Shield },
  { href: "/admin/security", label: "Security", icon: KeyRound },
  { href: "/admin/email-templates", label: "Email", icon: Mail },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/teams", label: "Teams", icon: Users },
  { href: "/admin/backups", label: "Backups", icon: Database },
  { href: "/admin/performance", label: "Performance", icon: Timer },
];

function isAdminToken(token: string | null) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as { role?: string };
    return payload.role === "admin";
  } catch {
    return false;
  }
}

function isBoneyardBuild() {
  return typeof window !== "undefined" && Boolean((window as Window & { __BONEYARD_BUILD?: boolean }).__BONEYARD_BUILD);
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const ready = isAdminToken(token) || isBoneyardBuild();

  useEffect(() => {
    if (!ready) router.replace("/");
  }, [ready, router]);

  if (!ready) return null;

  return (
    <div className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[236px_1fr]">
      <aside className="border-b border-border bg-card lg:min-h-dvh lg:border-b-0 lg:border-r">
        <div className="border-b border-border p-4">
          <Link href="/admin" className="block text-sm font-semibold">diyaa.ai admin</Link>
          <div className="mt-1 text-xs text-muted-foreground">Observability and control</div>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-2 lg:block lg:space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex h-9 shrink-0 items-center gap-2 px-3 text-sm transition-colors ${active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
