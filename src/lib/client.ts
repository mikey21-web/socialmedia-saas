import { PLATFORM_META } from './types';
import type { Platform } from './types';

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: value >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
}

export function formatFullNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDate(value: string | null): string {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(value: string | null): string {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function relativeTime(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const future = diff < 0;
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  let text: string;
  if (minutes < 1) text = 'just now';
  else if (minutes < 60) text = `${minutes}m`;
  else if (hours < 24) text = `${hours}h`;
  else if (days < 30) text = `${days}d`;
  else text = `${Math.round(days / 30)}mo`;
  if (text === 'just now') return text;
  return future ? `in ${text}` : `${text} ago`;
}

export function toLocalInputValue(iso: string | null): string {
  const date = iso ? new Date(iso) : new Date(Date.now() + 60 * 60 * 1000);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function platformLabel(platform: Platform): string {
  return PLATFORM_META[platform]?.label ?? platform;
}

export function platformColor(platform: Platform): string {
  return PLATFORM_META[platform]?.color ?? '#8b98a5';
}

export function platformShort(platform: Platform): string {
  return PLATFORM_META[platform]?.short ?? platform;
}
