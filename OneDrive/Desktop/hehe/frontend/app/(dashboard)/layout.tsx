"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart2,
  Bot,
  Calendar,
  CheckCircle2,
  FileImage,
  FileText,
  Flame,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Menu,
  Repeat2,
  Rss,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthGuard } from "@/components/auth-guard";
import { UpgradeBanner } from "@/components/upgrade-banner";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/inbox",                  label: "Inbox",        icon: Inbox },
  { href: "/trends",                 label: "Trends",       icon: Flame },
  { href: "/competitors",            label: "Competitors",  icon: Users },
  { href: "/posts",                  label: "Posts",        icon: FileText },
  { href: "/approval/queue",          label: "Approval",     icon: CheckCircle2 },
  { href: "/calendar",               label: "Calendar",     icon: Calendar },
  { href: "/media",                  label: "Media",        icon: FileImage },
  { href: "/recurring",              label: "Recurring",    icon: Repeat2 },
  { href: "/rss",                    label: "RSS Feeds",    icon: Rss },
  { href: "/sets",                   label: "Sets",         icon: FolderKanban },
{ href: "/analytics",              label: "Analytics",    icon: BarChart2 },
  { href: "/recommendations",        label: "Ideas",        icon: Sparkles },
  { href: "/settings/automation",    label: "Automation",   icon: Bot },
  { href: "/settings",               label: "Settings",     icon: Settings },
];

function DashboardNav({
  pathname,
  mobile = false,
  onNavigate,
}: {
  pathname: string;
  mobile?: boolean;
  onNavigate: () => void;
}) {
  const activeHref = navItems
    .filter(({ href }) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className={cn("flex-1 p-3 space-y-1", mobile && "pt-2")}>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex h-dvh bg-background">
      <aside className="hidden md:flex w-60 shrink-0 border-r border-border bg-sidebar flex-col">
        <div className="h-14 flex items-center px-5 border-b border-border">
          <span className="font-semibold text-sm">Diyaa AI</span>
        </div>
        <DashboardNav pathname={pathname} onNavigate={() => setOpen(false)} />
      </aside>

      <div className="flex-1 overflow-hidden flex flex-col">
        <header className="h-14 border-b border-border bg-background flex items-center justify-between px-3 md:px-5">
          <div className="font-semibold text-sm md:hidden">Diyaa AI</div>
          <div className="hidden md:block text-sm text-muted-foreground">Workspace</div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={() => setOpen((v) => !v)} className="h-11 w-11 md:hidden">
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </header>

        {open && (
          <div className="md:hidden border-b border-border bg-sidebar">
            <DashboardNav pathname={pathname} mobile onNavigate={() => setOpen(false)} />
          </div>
        )}

        <main className="flex-1 overflow-auto bg-background">
          <UpgradeBanner />
          {children}
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}
