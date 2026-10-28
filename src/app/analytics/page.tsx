'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { EngagementChart } from '@/components/charts';
import { AnalyticsIcon, BoltIcon, ExternalIcon, RefreshIcon, TrendUpIcon } from '@/components/icons';
import {
  Badge,
  CardSkeleton,
  ErrorBanner,
  PageHeader,
  PlatformBadge,
  SectionCard,
  StatCard,
} from '@/components/ui';
import { api, formatFullNumber, formatNumber, platformColor, platformLabel } from '@/lib/client';
import type { AnalyticsPoint, PlatformAnalytics, Post } from '@/lib/types';

interface AnalyticsResponse {
  days: number;
  points: AnalyticsPoint[];
  platforms: PlatformAnalytics[];
  totals: {
    published: number;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    engagementRate: number;
  };
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [analytics, posts] = await Promise.all([
        api<AnalyticsResponse>(`/api/analytics?days=${days}`),
        api<{ posts: Post[] }>('/api/posts?status=published&limit=50'),
      ]);
      setData(analytics);
      setTopPosts([...posts.posts].sort((a, b) => b.impressions - a.impressions).slice(0, 6));
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const bestPlatform = data?.platforms.length
    ? [...data.platforms].sort((a, b) => b.engagementRate - a.engagementRate)[0]
    : null;
  const totalClicks = data?.platforms.reduce((sum, platform) => sum + platform.clicks, 0) ?? 0;
  const totalEngagements = data?.platforms.reduce(
    (sum, platform) => sum + platform.likes + platform.comments + platform.shares,
    0
  ) ?? 0;

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Analytics"
        description="Local metrics across every platform. Seeded demo data is updated when posts publish."
        actions={
          <>
            <select
              className="select w-[140px]"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              aria-label="Date range"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()} disabled={loading}>
              <RefreshIcon className="h-4 w-4" />
              Refresh
            </button>
          </>
        }
      />

      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} lines={2} />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Impressions"
              value={formatNumber(data.platforms.reduce((sum, platform) => sum + platform.impressions, 0))}
              hint={`Across ${data.platforms.length} platforms`}
              icon={<AnalyticsIcon className="h-4 w-4" />}
            />
            <StatCard
              label="Engagements"
              value={formatNumber(totalEngagements)}
              hint={`${formatFullNumber(data.totals.likes)} likes included`}
              icon={<BoltIcon className="h-4 w-4" />}
              accent="#8b5cf6"
            />
            <StatCard
              label="Engagement rate"
              value={`${data.totals.engagementRate}%`}
              hint={bestPlatform ? `${platformLabel(bestPlatform.platform)} leads at ${bestPlatform.engagementRate}%` : 'No data yet'}
              icon={<TrendUpIcon className="h-4 w-4" />}
              accent="#f59e0b"
            />
            <StatCard
              label="Link clicks"
              value={formatNumber(totalClicks)}
              hint={`${data.totals.published} published posts`}
              icon={<ExternalIcon className="h-4 w-4" />}
              accent="#ec4899"
            />
          </div>

          <SectionCard
            title={`Engagement over ${days} days`}
            description="Impressions are filled, engagements are dashed."
            action={<Badge tone="success">Live local data</Badge>}
          >
            <EngagementChart data={data.points} />
          </SectionCard>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <SectionCard title="Platform performance" description="Engagement rate is engagements divided by impressions.">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/8 text-[10.5px] uppercase tracking-[0.07em] text-[#5d6a77]">
                      <th className="py-2 pr-3 font-semibold">Platform</th>
                      <th className="py-2 pr-3 text-right font-semibold">Posts</th>
                      <th className="py-2 pr-3 text-right font-semibold">Impressions</th>
                      <th className="py-2 pr-3 text-right font-semibold">Likes</th>
                      <th className="py-2 pr-3 text-right font-semibold">Comments</th>
                      <th className="py-2 pr-3 text-right font-semibold">Shares</th>
                      <th className="py-2 text-right font-semibold">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.platforms.map((platform) => (
                      <tr key={platform.platform} className="border-b border-white/5 last:border-0">
                        <td className="py-2.5 pr-3">
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ background: platformColor(platform.platform) }} />
                            <span className="font-semibold text-white">{platformLabel(platform.platform)}</span>
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-right text-[#c9d3dc]">{platform.posts}</td>
                        <td className="py-2.5 pr-3 text-right text-[#c9d3dc]">{formatNumber(platform.impressions)}</td>
                        <td className="py-2.5 pr-3 text-right text-[#c9d3dc]">{formatNumber(platform.likes)}</td>
                        <td className="py-2.5 pr-3 text-right text-[#c9d3dc]">{formatNumber(platform.comments)}</td>
                        <td className="py-2.5 pr-3 text-right text-[#c9d3dc]">{formatNumber(platform.shares)}</td>
                        <td className="py-2.5 text-right">
                          <span className="font-semibold text-[#00ff88]">{platform.engagementRate}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard
              title="Top posts"
              description="Ranked by impressions in your local database."
              action={
                <Link href="/posts" className="btn btn-ghost btn-sm">
                  All posts
                </Link>
              }
            >
              {topPosts.length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-[#8b98a5]">
                  Publish a post to see performance here.
                </p>
              ) : (
                <ul className="divide-y divide-white/6">
                  {topPosts.map((post, index) => (
                    <li key={post.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/6 text-[10px] font-bold text-[#8b98a5]">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs leading-5 text-[#c9d3dc]">{post.content}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {post.platforms.map((platform) => (
                              <PlatformBadge key={platform} platform={platform} />
                            ))}
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 text-[10.5px] text-[#6b7785]">
                            <span>{formatNumber(post.impressions)} impressions</span>
                            <span>{formatNumber(post.likes)} likes</span>
                            {post.externalUrl ? (
                              <a href={post.externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#00ff88]">
                                Open <ExternalIcon className="h-3 w-3" />
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
