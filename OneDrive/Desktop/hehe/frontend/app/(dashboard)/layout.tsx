"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart2,
  Bot,
  Brain,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  FileImage,
  FileText,
  Film,
  Flame,
  FolderKanban,
  Inbox,
  Kanban,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Mic2,
  Repeat2,
  Rss,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthGuard } from "@/components/auth-guard";
import { UpgradeBanner } from "@/components/upgrade-banner";
import { NotificationBell } from "@/components/notification-bell";
import { AgentSidebar } from "@/components/agent/AgentSidebar";
import { NpsSurvey } from "@/components/nps-survey";
import { FeatureDiscoveryBanner } from "@/components/feature-discovery";
import { cn } from "@/lib/utils";

/* ─── Navigation structure ─────────────────────────────────────────────────── */

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Primary nav — always visible (8 items)
const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard",       label: "Dashboard",  icon: LayoutDashboard },
  { href: "/posts",           label: "Posts",      icon: FileText },
  { href: "/calendar",        label: "Calendar",   icon: Calendar },
  { href: "/analytics",       label: "Analytics",  icon: BarChart2 },
  { href: "/agency",          label: "AI Agency",  icon: Zap },
  { href: "/inbox",           label: "Inbox",      icon: Inbox },
  { href: "/media",           label: "Media",      icon: FileImage },
  { href: "/settings",        label: "Settings",   icon: Settings },
];

// Expandable sections
const SECTIONS: NavSection[] = [
  {
    id: "agency",
    label: "AI Team",
    icon: Zap,
    defaultOpen: true,
    items: [
      { href: "/agency/office",      label: "The Office",   icon: Building2 },
      { href: "/agency/brand-voice", label: "Brand Voice",  icon: Mic2 },
      { href: "/agency/strategy",    label: "Strategy",     icon: Brain },
      { href: "/agency/pipeline",    label: "Pipeline",     icon: Kanban },
      { href: "/agency/inbox",       label: "Engagement",   icon: MessageSquare },
      { href: "/agency/reports",     label: "Reports",      icon: TrendingUp },
      { href: "/agency/clients",     label: "Clients",      icon: Users },
    ],
  },
  {
    id: "content",
    label: "Create",
    icon: Sparkles,
    items: [
      { href: "/reels",              label: "Reel Studio",  icon: Clapperboard },
      { href: "/carousel",           label: "Carousel",     icon: FileImage },
      { href: "/hyperframes",        label: "Animated",     icon: Wand2 },
      { href: "/video",              label: "Video",        icon: Film },
      { href: "/recommendations",    label: "Ideas",        icon: Sparkles },
      { href: "/chat",               label: "AI Chat",      icon: MessageSquare },
    ],
  },
  {
    id: "monitor",
    label: "Monitor",
    icon: TrendingUp,
    items: [
      { href: "/competitors",        label: "Competitors",  icon: Users },
      { href: "/trends",             label: "Trends",       icon: Flame },
      { href: "/approval/queue",     label: "Approval",     icon: CheckCircle2 },
      { href: "/analytics/roi",      label: "ROI",          icon: BarChart2 },
      { href: "/analytics/insights", label: "Insights",     icon: Brain },
    ],
  },
  {
    id: "more",
    label: "More",
    icon: FolderKanban,
    items: [
      { href: "/recurring",          label: "Recurring",    icon: Repeat2 },
      { href: "/rss",                label: "RSS Feeds",    icon: Rss },
      { href: "/sets",               label: "Sets",         icon: FolderKanban },
      { href: "/settings/automation",label: "Automation",   icon: Bot },
    ],
  },
];

/* ─── Sidebar component ────────────────────────────────────────────────────── */

function DashboardNav({
  pathname,
  mobile = false,
  onNavigate,
}: {
  pathname: string;
  mobile?: boolean;
  onNavigate: () => void;
}) {
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const defaults = new Set<string>();
    // Auto-open section if user is on a page within it
    for (const section of SECTIONS) {
      if (section.defaultOpen || section.items.some(item => pathname.startsWith(item.href))) {
        defaults.add(section.id);
      }
    }
    return defaults;
  });

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className={cn("flex-1 p-3 space-y-1 overflow-y-auto", mobile && "pt-2")}>
      {/* Primary nav items */}
      {PRIMARY_NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            isActive(href)
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </Link>
      ))}

      {/* Divider */}
      <div className="h-px bg-border my-3" />

      {/* Expandable sections */}
      {SECTIONS.map((section) => {
        const isOpen = openSections.has(section.id);
        const hasActiveChild = section.items.some((item) => isActive(item.href));
        const SectionIcon = section.icon;

        return (
          <div key={section.id}>
            <button
              onClick={() => toggleSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                hasActiveChild
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <SectionIcon className="size-4 shrink-0" />
              <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider opacity-70">
                {section.label}
              </span>
              <ChevronDown
                className={cn(
                  "size-3.5 text-muted-foreground transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            {isOpen && (
              <div className="ml-3 pl-3 border-l border-border/50 space-y-0.5 mt-0.5 mb-2">
                {section.items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors",
                      isActive(href)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* ─── Layout ───────────────────────────────────────────────────────────────── */

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [agentSidebarOpen, setAgentSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex h-dvh bg-background relative overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 shrink-0 border-r border-border bg-sidebar flex-col">
          <div className="h-14 flex items-center px-5 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="size-3 text-white" />
              </div>
              <span className="font-semibold text-sm">Diyaa AI</span>
            </Link>
          </div>
          <DashboardNav pathname={pathname} onNavigate={() => setOpen(false)} />
        </aside>

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <header className="h-14 border-b border-border bg-background flex items-center justify-between px-3 md:px-5 shrink-0">
            <div className="font-semibold text-sm md:hidden">Diyaa AI</div>
            <div className="hidden md:block text-sm text-muted-foreground">Workspace</div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpen((v) => !v)}
                className="h-11 w-11 md:hidden"
              >
                {open ? <X className="size-4" /> : <Menu className="size-4" />}
              </Button>
            </div>
          </header>

          {/* Mobile nav */}
          {open && (
            <div className="md:hidden border-b border-border bg-sidebar shrink-0 max-h-[60vh] overflow-y-auto">
              <DashboardNav pathname={pathname} mobile onNavigate={() => setOpen(false)} />
            </div>
          )}

          {/* Main content */}
          <main className="flex-1 min-h-0 bg-background flex flex-col overflow-hidden">
            <UpgradeBanner />
            <FeatureDiscoveryBanner />
            <div className="flex-1 min-h-0 relative overflow-hidden">
              {children}
            </div>
          </main>
        </div>

        {/* Floating AI Agent button */}
        <button
          onClick={() => setAgentSidebarOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30 shrink-0"
          aria-label="Open AI Agent"
        >
          <Bot className="w-6 h-6" />
        </button>

        {/* Agent sidebar */}
        <AgentSidebar
          open={agentSidebarOpen}
          onClose={() => setAgentSidebarOpen(false)}
        />

        {/* NPS Survey (shows after 7 days, once per 90 days) */}
        <NpsSurvey />
      </div>
    </AuthGuard>
  );
}
