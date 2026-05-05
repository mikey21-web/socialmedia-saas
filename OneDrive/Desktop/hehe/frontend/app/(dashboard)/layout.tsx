 "use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart2, Calendar, LayoutDashboard, Menu, Settings, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",  label: "Dashboard", icon: LayoutDashboard },
  { href: "/posts",      label: "Posts",     icon: FileText },
  { href: "/calendar",   label: "Calendar",  icon: Calendar },
  { href: "/analytics",  label: "Analytics", icon: BarChart2 },
  { href: "/settings",   label: "Settings",  icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const Nav = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={cn("flex-1 p-3 space-y-1", mobile && "pt-2")}>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
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

  return (
    <div className="flex h-dvh bg-background">
      <aside className="hidden md:flex w-60 shrink-0 border-r border-border bg-sidebar flex-col">
        <div className="h-14 flex items-center px-5 border-b border-border">
          <span className="font-semibold text-sm">Postiz</span>
        </div>
        <Nav />
      </aside>

      <div className="flex-1 overflow-hidden flex flex-col">
        <header className="md:hidden h-14 border-b border-border bg-background flex items-center justify-between px-3">
          <div className="font-semibold text-sm">Postiz</div>
          <Button variant="outline" size="icon" onClick={() => setOpen((v) => !v)} className="h-11 w-11">
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </header>

        {open && (
          <div className="md:hidden border-b border-border bg-sidebar">
            <Nav mobile />
          </div>
        )}

        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
