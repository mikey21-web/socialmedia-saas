'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BarList, EngagementChart } from '@/components/charts';
import {
  AnalyticsIcon,
  BoltIcon,
  CalendarIcon,
  ExternalIcon,
  PlusIcon,
  RefreshIcon,
  SendIcon,
  SparklesIcon,
  TrendUpIcon,
} from '@/components/icons';
import {
  Badge,
  CardSkeleton,
  ErrorBanner,
  PageHeader,
  PlatformBadge,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/ui';
import { api, formatDateTime, formatNumber, platformColor, platformLabel, relativeTime } from '@/lib/client';
import type { DashboardData, Post } from '@/lib/types';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const payload = await api<DashboardData>('/api/dashboard');
      setData(payload);
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runScheduler = async () => {
    try {
      setBusy(true);
      setNotice(null);
      const result = await api<{ published: number; failed: number }>('/api/scheduler/run', { method: 'POST' });
      setNotice(
        result.published > 0
          ? `Autopilot published ${result.published} due post${result.published === 1 ? '' : 's'}.`
          : 'No due posts right now. Everything is up to date.'
      );
      await load();
    } catch (runError) {
      setError((runError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const publishNow = async (post: Post) => {
    try {
      setBusy(true);
      setNotice(null);
      const result = await api<{ ok: boolean; post: Post }>(`/api/posts/${post.id}/publish`, { method: 'POST' });
      setNotice(result.ok ? `Post #${post.id} published.` : `Post #${post.id} could not be published.`);
      await load();
    } catch (publishError) {
      setError((publishError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return (
      <div className="space-y-6">
        {error ? <ErrorBanner message={error} onRetry={load} /> : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} lines={2} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CardSkeleton lines={5} />
          </div>
          <CardSkeleton lines={5} />
        </div>
      </div>
    );
  }

  const { profile, totals, accounts, analytics, platformBreakdown, upcoming, recentPosts, activity, ai, scheduler } =
    data;
  const connected = accounts.filter((account) => account.status === 'connected').length;

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title={`${greeting()}, ${profile.name.split(' ')[0]}`}
        description={`${profile.company} · ${profile.niche}`}
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()} disabled={busy}>
              <RefreshIcon className="h-4 w-4" />
              Refresh
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void runScheduler()} disabled={busy}>
              <BoltIcon className="h-4 w-4" />
              Run autopilot
            </button>
            <Link href="/create" className="btn btn-primary btn-sm">
              <SparklesIcon className="h-4 w-4" />
              Generate posts
            </Link>
          </>
        }
      />

      {error ? <ErrorBanner message={error} onRetry={load} /> : null}
      {notice ? (
        <div className="rounded-xl border border-[#00ff88]/25 bg-[#00ff88]/8 px-4 py-3 text-sm text-[#8ae9bd]">{notice}</div>
      ) : null}

      {!ai.configured ? (
        <div className="flex flex-col gap-3 rounded-xl border border-[#8b5cf6]/30 bg-[#8b5cf6]/8 px-4 py-3 text-sm text-[#c4b5fd] sm:flex-row sm:items-center sm:justify-between">
          <span>
            You are in mock mode. Posts still generate and publish in demo mode. Add a Groq API key to generate with
            live AI.
          </span>
          <Link href="/settings" className="btn btn-secondary btn-sm">
            Add Groq key
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Followers"
          value={formatNumber(totals.followers)}
          hint={`${connected} of ${accounts.length} platforms connected`}
          icon={<TrendUpIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Impressions"
          value={formatNumber(totals.impressions)}
          hint="Lifetime across all posts"
          icon={<AnalyticsIcon className="h-4 w-4" />}
          accent="#8b5cf6"
        />
        <StatCard
          label="Engagement rate"
          value={`${totals.engagementRate}%`}
          hint={`${formatNumber(totals.likes)} likes · ${formatNumber(totals.comments)} comments`}
          icon={<BoltIcon className="h-4 w-4" />}
          accent="#f59e0b"
        />
        <StatCard
          label="Scheduled"
          value={String(totals.scheduled)}
          hint={`${totals.drafts} drafts · ${totals.failed} failed`}
          icon={<CalendarIcon className="h-4 w-4" />}
          accent="#ec4899"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Engagement, last 30 days"
          description="Impressions and engagements across every connected platform."
          className="lg:col-span-2"
          action={
            <Link href="/analytics" className="btn btn-ghost btn-sm">
              Full analytics <ExternalIcon className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <EngagementChart data={analytics} />
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/6 pt-4 sm:grid-cols-4">
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.08em] text-[#6b7785]">Published</p>
              <p className="mt-1 text-lg font-bold text-white">{totals.published}</p>
            </div>
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.08em] text-[#6b7785]">Likes</p>
              <p className="mt-1 text-lg font-bold text-white">{formatNumber(totals.likes)}</p>
            </div>
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.08em] text-[#6b7785]">Comments</p>
              <p className="mt-1 text-lg font-bold text-white">{formatNumber(totals.comments)}</p>
            </div>
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.08em] text-[#6b7785]">Shares</p>
              <p className="mt-1 text-lg font-bold text-white">{formatNumber(totals.shares)}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Platform breakdown"
          description="Where the attention comes from."
          action={<Badge tone={scheduler.autopilot ? 'success' : 'warning'}>{scheduler.autopilot ? 'Autopilot on' : 'Autopilot off'}</Badge>}
        >
          <BarList
            items={platformBreakdown.map((item) => ({
              label: platformLabel(item.platform),
              value: item.impressions,
              color: platformColor(item.platform),
              hint: `${formatNumber(item.impressions)} · ${item.engagementRate}%`,
            }))}
          />
          <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-3 text-xs text-[#8b98a5]">
            <div className="flex items-center justify-between">
              <span>Auto-poster</span>
              <span className={scheduler.autopilot ? 'font-semibold text-[#00ff88]' : 'font-semibold text-[#fbbf24]'}>
                {scheduler.autopilot ? 'Running' : 'Paused'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Last run</span>
              <span className="text-[#c9d3dc]">{scheduler.lastRun ? relativeTime(scheduler.lastRun) : 'Not yet'}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Published last run</span>
              <span className="text-[#c9d3dc]">{scheduler.publishedLastRun}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Upcoming schedule"
          description="Due posts publish automatically while autopilot is on."
          action={
            <Link href="/calendar" className="btn btn-ghost btn-sm">
              Calendar
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-[#8b98a5]">
              Nothing scheduled. Generate a batch and schedule it.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((post) => (
                <li key={post.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {post.platforms.map((platform) => (
                        <PlatformBadge key={platform} platform={platform} />
                      ))}
                    </div>
                    <span className="text-[11px] text-[#8b98a5]">{formatDateTime(post.scheduledAt)}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-[#c9d3dc]">{post.content}</p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm mt-2"
                    onClick={() => void publishNow(post)}
                    disabled={busy}
                  >
                    <SendIcon className="h-3.5 w-3.5" />
                    Publish now
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Recent posts"
          description="The latest content in your pipeline."
          action={
            <Link href="/posts" className="btn btn-ghost btn-sm">
              View all
            </Link>
          }
        >
          <ul className="divide-y divide-white/6">
            {recentPosts.slice(0, 5).map((post) => (
              <li key={post.id} className="py-3 first:pt-0 last:pb-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={post.status} />
                  {post.platforms.slice(0, 2).map((platform) => (
                    <PlatformBadge key={platform} platform={platform} />
                  ))}
                  {post.platforms.length > 2 ? <span className="text-[11px] text-[#6b7785]">+{post.platforms.length - 2}</span> : null}
                </div>
                <p className="line-clamp-2 text-xs text-[#c9d3dc]">{post.content}</p>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[#6b7785]">
                  <span>{post.publishedAt ? relativeTime(post.publishedAt) : relativeTime(post.createdAt)}</span>
                  <span>{formatNumber(post.impressions)} impressions</span>
                  {post.externalUrl ? (
                    <a href={post.externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#00ff88]">
                      Open <ExternalIcon className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Activity" description="Everything the workspace did recently.">
          <ul className="space-y-3">
            {activity.slice(0, 7).map((item) => (
              <li key={item.id} className="flex gap-3">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    background:
                      item.type === 'publish'
                        ? '#00ff88'
                        : item.type === 'fail'
                          ? '#f87171'
                          : item.type === 'schedule'
                            ? '#f59e0b'
                            : '#8b5cf6',
                  }}
                />
                <div>
                  <p className="text-xs leading-5 text-[#c9d3dc]">{item.message}</p>
                  <p className="text-[10.5px] text-[#5d6a77]">{relativeTime(item.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="card flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00ff88]/10 text-[#00ff88]">
            <SparklesIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Turn one idea into a week of posts</p>
            <p className="text-xs text-[#8b98a5]">
              Pick a topic, choose platforms, and generate drafts with {ai.mode === 'live' ? 'Groq' : 'the mock generator'}.
            </p>
          </div>
        </div>
        <Link href="/create" className="btn btn-primary btn-sm">
          <PlusIcon className="h-4 w-4" />
          Open composer
        </Link>
      </div>
    </div>
  );
}
