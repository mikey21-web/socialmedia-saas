'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, SendIcon } from '@/components/icons';
import { Badge, ErrorBanner, PageHeader, PlatformBadge, Skeleton, StatusBadge } from '@/components/ui';
import { api, cn, formatTime } from '@/lib/client';
import type { Post } from '@/lib/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await api<{ posts: Post[] }>('/api/posts?limit=500');
      setPosts(payload.posts);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const post of posts) {
      const anchor = post.scheduledAt ?? post.publishedAt;
      if (!anchor) continue;
      const key = dateKey(anchor);
      const list = map.get(key) ?? [];
      list.push(post);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const aTime = new Date(a.scheduledAt ?? a.publishedAt ?? a.createdAt).getTime();
        const bTime = new Date(b.scheduledAt ?? b.publishedAt ?? b.createdAt).getTime();
        return aTime - bTime;
      });
    }
    return map;
  }, [posts]);

  const grid = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const first = new Date(year, monthIndex, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    const cells: Array<{ date: Date; key: string; inMonth: boolean }> = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      cells.push({ date, key: dateKey(date.toISOString()), inMonth: date.getMonth() === monthIndex });
    }
    return cells;
  }, [month]);

  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayKey = dateKey(new Date().toISOString());
  const selectedPosts = selected ? grouped.get(selected) ?? [] : [];

  const publish = async (post: Post) => {
    try {
      setBusyId(post.id);
      setError(null);
      const result = await api<{ ok: boolean }>(`/api/posts/${post.id}/publish`, { method: 'POST' });
      setNotice(result.ok ? `Post #${post.id} published.` : `Post #${post.id} could not be published.`);
      await load();
    } catch (publishError) {
      setError((publishError as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Calendar"
        description="Scheduled posts, published history, and the autopilot queue at a glance."
        actions={
          <>
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="min-w-[140px] text-center text-sm font-semibold text-white">{monthLabel}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                aria-label="Next month"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMonth(new Date())}>
              Today
            </button>
            <Link href="/create" className="btn btn-primary btn-sm">
              <PlusIcon className="h-4 w-4" />
              Schedule
            </Link>
          </>
        }
      />

      {error ? <ErrorBanner message={error} onRetry={load} /> : null}
      {notice ? (
        <div className="rounded-xl border border-[#00ff88]/25 bg-[#00ff88]/8 px-4 py-3 text-sm text-[#8ae9bd]">{notice}</div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_0.4fr]">
        <section className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/8 bg-white/[0.02]">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-2 py-2 text-center text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#5d6a77]">
                {day}
              </div>
            ))}
          </div>
          {loading ? (
            <div className="grid grid-cols-7">
              {Array.from({ length: 42 }).map((_, index) => (
                <div key={index} className="min-h-[92px] border-b border-r border-white/6 p-2">
                  <Skeleton className="h-3 w-6" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {grid.map((cell) => {
                const dayPosts = grouped.get(cell.key) ?? [];
                const isToday = cell.key === todayKey;
                const isSelected = cell.key === selected;
                return (
                  <button
                    type="button"
                    key={cell.key}
                    onClick={() => setSelected(cell.key)}
                    className={cn(
                      'min-h-[92px] border-b border-r border-white/6 p-1.5 text-left transition-colors hover:bg-white/[0.03]',
                      !cell.inMonth && 'opacity-40',
                      isSelected && 'bg-[#00ff88]/6'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold',
                        isToday ? 'bg-[#00ff88] text-[#041008]' : 'text-[#8b98a5]'
                      )}
                    >
                      {cell.date.getDate()}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayPosts.slice(0, 2).map((post) => (
                        <span
                          key={post.id}
                          className="block truncate rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            background:
                              post.status === 'published'
                                ? 'rgba(0,255,136,0.12)'
                                : post.status === 'failed'
                                  ? 'rgba(248,113,113,0.12)'
                                  : 'rgba(245,158,11,0.12)',
                            color:
                              post.status === 'published'
                                ? '#7af3b4'
                                : post.status === 'failed'
                                  ? '#fca5a5'
                                  : '#fbbf24',
                          }}
                        >
                          {formatTime(post.scheduledAt ?? post.publishedAt ?? post.createdAt)} {post.content.slice(0, 24)}
                        </span>
                      ))}
                      {dayPosts.length > 2 ? (
                        <span className="block px-1 text-[10px] text-[#6b7785]">+{dayPosts.length - 2} more</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-white">
              {selected
                ? new Date(`${selected}T12:00:00`).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Pick a day'}
            </h2>
            {selected ? <Badge tone="neutral">{selectedPosts.length} posts</Badge> : null}
          </div>
          {!selected ? (
            <p className="rounded-xl border border-dashed border-white/10 px-3 py-8 text-center text-sm text-[#8b98a5]">
              Select a day to see what is publishing.
            </p>
          ) : selectedPosts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-3 py-8 text-center">
              <CalendarIcon className="mx-auto mb-2 h-5 w-5 text-[#5d6a77]" />
              <p className="text-sm text-[#8b98a5]">Nothing scheduled for this day.</p>
              <Link href="/create" className="btn btn-secondary btn-sm mt-3">
                Create one
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {selectedPosts.map((post) => (
                <li key={post.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={post.status} />
                    {post.platforms.map((platform) => (
                      <PlatformBadge key={platform} platform={platform} />
                    ))}
                  </div>
                  <p className="line-clamp-3 text-xs leading-5 text-[#c9d3dc]">{post.content}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10.5px] text-[#6b7785]">
                      {formatTime(post.scheduledAt ?? post.publishedAt ?? post.createdAt)}
                    </span>
                    {post.status !== 'published' ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => void publish(post)}
                        disabled={busyId === post.id}
                      >
                        <SendIcon className="h-3 w-3" />
                        Publish
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
