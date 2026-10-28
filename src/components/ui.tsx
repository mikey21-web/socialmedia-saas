'use client';

import type { ReactNode } from 'react';
import { PLATFORM_META } from '@/lib/types';
import type { Platform, PostStatus } from '@/lib/types';
import { cn, platformColor, platformShort } from '@/lib/client';
import { AlertIcon, CheckIcon, CloseIcon, ClockIcon } from './icons';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-[#8b98a5]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = '#00ff88',
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="card card-hover p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#8b98a5]">{label}</p>
        {icon ? (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: `${accent}14`, color: accent }}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-[26px]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#8b98a5]">{hint}</p> : null}
    </div>
  );
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  const meta = PLATFORM_META[platform];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
      style={{
        borderColor: `${platformColor(platform)}40`,
        background: `${platformColor(platform)}12`,
        color: meta?.color ?? '#e6edf3',
      }}
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold"
        style={{ background: `${platformColor(platform)}20`, color: meta?.color }}
      >
        {platformShort(platform)}
      </span>
      {meta?.label ?? platform}
    </span>
  );
}

const statusStyles: Record<PostStatus, { label: string; className: string; icon: ReactNode }> = {
  draft: { label: 'Draft', className: 'text-[#a4b1bd] bg-white/5 border-white/10', icon: null },
  scheduled: {
    label: 'Scheduled',
    className: 'text-[#fbbf24] bg-[#f59e0b]/10 border-[#f59e0b]/25',
    icon: <ClockIcon className="h-3 w-3" />,
  },
  published: {
    label: 'Published',
    className: 'text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/25',
    icon: <CheckIcon className="h-3 w-3" />,
  },
  failed: {
    label: 'Failed',
    className: 'text-[#fca5a5] bg-[#f87171]/10 border-[#f87171]/25',
    icon: <AlertIcon className="h-3 w-3" />,
  },
};

export function StatusBadge({ status }: { status: PostStatus }) {
  const style = statusStyles[status];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', style.className)}>
      {style.icon}
      {style.label}
    </span>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' | 'violet';
}) {
  const tones: Record<string, string> = {
    neutral: 'border-white/10 bg-white/5 text-[#a4b1bd]',
    success: 'border-[#00ff88]/25 bg-[#00ff88]/10 text-[#00ff88]',
    warning: 'border-[#f59e0b]/25 bg-[#f59e0b]/10 text-[#fbbf24]',
    danger: 'border-[#f87171]/25 bg-[#f87171]/10 text-[#fca5a5]',
    accent: 'border-[#8b5cf6]/25 bg-[#8b5cf6]/10 text-[#c4b5fd]',
    violet: 'border-[#8b5cf6]/25 bg-[#8b5cf6]/10 text-[#c4b5fd]',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', tones[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/12 px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-[#8b98a5]">
        <ClockIcon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 max-w-md text-sm text-[#8b98a5]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#f87171]/30 bg-[#f87171]/8 px-4 py-3 text-sm text-[#fca5a5] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
      {onRetry ? (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-[#8b98a5]">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors',
          checked ? 'border-[#00ff88]/50 bg-[#00ff88]' : 'border-white/15 bg-white/8',
          disabled && 'opacity-50'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          )}
          style={{ height: 18, width: 18 }}
        />
      </button>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="card fade-in w-full max-w-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-1">{children}</div>
        {footer ? <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card space-y-3 p-5">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('card p-5', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-white">{title}</h2>
          {description ? <p className="mt-1 text-xs text-[#8b98a5]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
