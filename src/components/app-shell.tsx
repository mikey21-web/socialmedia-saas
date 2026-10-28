'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/client';
import {
  AnalyticsIcon,
  BoltIcon,
  CalendarIcon,
  CloseIcon,
  DashboardIcon,
  MenuIcon,
  PlusIcon,
  PostsIcon,
  SettingsIcon,
  SparklesIcon,
} from './icons';

const navigation = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { href: '/posts', label: 'Posts', icon: PostsIcon },
  { href: '/create', label: 'Create with AI', icon: SparklesIcon },
  { href: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { href: '/analytics', label: 'Analytics', icon: AnalyticsIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#00ff88] text-[#041008]">
        <BoltIcon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-[15px] font-extrabold leading-4 tracking-tight text-white">Pulse</span>
        <span className="block text-[10.5px] font-medium tracking-[0.14em] text-[#8b98a5]">SOCIAL OS</span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-[#00ff88]/10 text-white'
                : 'text-[#8b98a5] hover:bg-white/5 hover:text-white'
            )}
          >
            <Icon
              className={cn('h-[18px] w-[18px]', active ? 'text-[#00ff88]' : 'text-[#6b7785] group-hover:text-white')}
            />
            {item.label}
            {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#00ff88]" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function StatusFooter() {
  const [mode, setMode] = useState<'live' | 'mock' | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/ai/status')
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setMode(data.mode === 'live' ? 'live' : 'mock');
      })
      .catch(() => {
        if (!cancelled) setMode('mock');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#8b98a5]">AI generation</span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 font-semibold',
            mode === 'live' ? 'text-[#00ff88]' : 'text-[#c4b5fd]'
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', mode === 'live' ? 'bg-[#00ff88]' : 'bg-[#8b5cf6]')} />
          {mode === null ? 'checking' : mode === 'live' ? 'Groq live' : 'Mock mode'}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="text-[#8b98a5]">Storage</span>
        <span className="font-semibold text-[#c9d3dc]">SQLite local</span>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen lg:flex">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-white/8 bg-[#080b0e]/95 px-4 py-5 backdrop-blur lg:flex">
        <Brand />
        <div className="mt-8 flex-1">
          <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#5d6a77]">Workspace</p>
          <NavLinks />
        </div>
        <div className="space-y-3">
          <StatusFooter />
          <div className="flex items-center gap-2.5 rounded-xl px-1 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#00ff88] to-[#0ea5e9] text-xs font-bold text-[#041008]">
              US
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">Uday Sharma</p>
              <p className="truncate text-[11px] text-[#8b98a5]">Diyaa AI</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen w-full flex-col lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/8 bg-[#060809]/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn btn-ghost btn-sm lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <Brand />
            </div>
            <p className="hidden text-xs text-[#8b98a5] lg:block">
              Local workspace · <span className="text-[#c9d3dc]">everything runs on your machine</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/create" className="btn btn-primary btn-sm">
              <PlusIcon className="h-4 w-4" />
              New post
            </Link>
            <Link
              href="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[11px] font-bold text-white"
              aria-label="Settings"
            >
              US
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>

        <footer className="border-t border-white/6 px-4 py-4 text-center text-[11px] text-[#5d6a77] sm:px-6">
          Pulse Social OS · Local demo · SQLite + Groq + LinkedIn auto-posting
        </footer>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-white/8 bg-[#080b0e] px-4 py-5">
            <div className="flex items-center justify-between">
              <Brand />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Close">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-8 flex-1">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <StatusFooter />
          </div>
        </div>
      ) : null}
    </div>
  );
}
