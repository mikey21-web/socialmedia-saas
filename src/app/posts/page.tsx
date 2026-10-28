'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  CalendarIcon,
  ExternalIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  SendIcon,
  TrashIcon,
} from '@/components/icons';
import {
  EmptyState,
  ErrorBanner,
  Modal,
  PageHeader,
  PlatformBadge,
  Skeleton,
  StatusBadge,
} from '@/components/ui';
import { api, cn, formatDateTime, formatNumber, toLocalInputValue } from '@/lib/client';
import { PLATFORMS } from '@/lib/types';
import type { Platform, Post, PostStatus, Tone } from '@/lib/types';

const statusOptions: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Drafts' },
  { value: 'failed', label: 'Failed' },
];

const toneOptions: Tone[] = ['professional', 'casual', 'funny', 'inspirational', 'bold'];

interface EditState {
  post: Post;
  content: string;
  platforms: Platform[];
  status: 'draft' | 'scheduled';
  scheduledAt: string;
  tone: Tone;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (status !== 'all') params.set('status', status);
        if (platform !== 'all') params.set('platform', platform);
        if (query.trim()) params.set('q', query.trim());
        const payload = await api<{ posts: Post[] }>(`/api/posts?${params.toString()}`, { signal });
        setPosts(payload.posts);
      } catch (loadError) {
        if ((loadError as Error).name !== 'AbortError') setError((loadError as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [platform, query, status]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void load(controller.signal);
    }, 220);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [load]);

  const publish = async (post: Post) => {
    try {
      setBusyId(post.id);
      setError(null);
      const result = await api<{ ok: boolean; results: Array<{ detail: string; platform: Platform; mode: string }> }>(
        `/api/posts/${post.id}/publish`,
        { method: 'POST' }
      );
      const live = result.results?.some((entry) => entry.mode === 'live');
      setNotice(`Post #${post.id} published${live ? ' to LinkedIn live' : ' in demo mode'}.`);
      await load();
    } catch (publishError) {
      setError((publishError as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (post: Post) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      setBusyId(post.id);
      await api(`/api/posts/${post.id}`, { method: 'DELETE' });
      setNotice(`Post #${post.id} deleted.`);
      await load();
    } catch (deleteError) {
      setError((deleteError as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (post: Post) => {
    setEdit({
      post,
      content: post.content,
      platforms: post.platforms,
      status: post.status === 'scheduled' ? 'scheduled' : 'draft',
      scheduledAt: toLocalInputValue(post.scheduledAt),
      tone: post.tone ?? 'professional',
    });
  };

  const saveEdit = async () => {
    if (!edit) return;
    try {
      setSaving(true);
      setError(null);
      await api(`/api/posts/${edit.post.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          content: edit.content,
          platforms: edit.platforms,
          status: edit.status,
          scheduledAt: edit.status === 'scheduled' ? edit.scheduledAt : null,
          tone: edit.tone,
        }),
      });
      setNotice(`Post #${edit.post.id} updated.`);
      setEdit(null);
      await load();
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Posts"
        description="Every draft, scheduled post, and published update in one place."
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()} disabled={loading}>
              <RefreshIcon className="h-4 w-4" />
              Refresh
            </button>
            <Link href="/create" className="btn btn-primary btn-sm">
              <PlusIcon className="h-4 w-4" />
              New post
            </Link>
          </>
        }
      />

      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
      {notice ? (
        <div className="rounded-xl border border-[#00ff88]/25 bg-[#00ff88]/8 px-4 py-3 text-sm text-[#8ae9bd]">{notice}</div>
      ) : null}

      <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5d6a77]" />
          <input
            className="input pl-9"
            placeholder="Search content or topic..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search posts"
          />
        </div>
        <select className="select sm:w-[170px]" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select className="select sm:w-[170px]" value={platform} onChange={(event) => setPlatform(event.target.value)} aria-label="Filter by platform">
          <option value="all">All platforms</option>
          {PLATFORMS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="card space-y-3 p-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          title="No posts match these filters"
          description="Try clearing the search or generate a fresh batch with AI."
          action={
            <Link href="/create" className="btn btn-primary btn-sm">
              <PlusIcon className="h-4 w-4" />
              Create a post
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#8b98a5]">
            Showing <span className="font-semibold text-white">{posts.length}</span> post{posts.length === 1 ? '' : 's'}
          </p>
          {posts.map((post) => (
            <article key={post.id} className="card card-hover p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={post.status as PostStatus} />
                    {post.platforms.map((item) => (
                      <PlatformBadge key={item} platform={item} />
                    ))}
                    {post.source === 'ai' ? (
                      <span className="pill text-[#c4b5fd]">AI generated</span>
                    ) : null}
                    <span className="text-[11px] text-[#5d6a77]">#{post.id}</span>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-6 text-[#d7dee6]">{post.content}</p>
                  {post.hashtags.length ? (
                    <p className="mt-2 text-xs text-[#00ff88]/80">{post.hashtags.map((tag) => `#${tag}`).join(' ')}</p>
                  ) : null}
                  {post.error ? (
                    <p className="mt-2 rounded-lg border border-[#f87171]/20 bg-[#f87171]/8 px-2.5 py-1.5 text-xs text-[#fca5a5]">
                      {post.error}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#6b7785]">
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {post.status === 'scheduled'
                        ? `Scheduled ${formatDateTime(post.scheduledAt)}`
                        : post.publishedAt
                          ? `Published ${formatDateTime(post.publishedAt)}`
                          : `Created ${formatDateTime(post.createdAt)}`}
                    </span>
                    <span>{formatNumber(post.impressions)} impressions</span>
                    <span>{formatNumber(post.likes)} likes</span>
                    {post.externalUrl ? (
                      <a href={post.externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#00ff88]">
                        View post <ExternalIcon className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
                  {post.status !== 'published' ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => void publish(post)}
                      disabled={busyId === post.id}
                    >
                      <SendIcon className="h-3.5 w-3.5" />
                      {busyId === post.id ? 'Publishing...' : 'Publish now'}
                    </button>
                  ) : null}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(post)}>
                    <PencilIcon className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => void remove(post)}
                    disabled={busyId === post.id}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(edit)}
        onClose={() => setEdit(null)}
        title={edit ? `Edit post #${edit.post.id}` : 'Edit post'}
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEdit(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void saveEdit()} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </>
        }
      >
        {edit ? (
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="edit-content">
                Content
              </label>
              <textarea
                id="edit-content"
                className="textarea"
                value={edit.content}
                onChange={(event) => setEdit({ ...edit, content: event.target.value })}
              />
              <p className="mt-1 text-[11px] text-[#6b7785]">{edit.content.length} characters</p>
            </div>
            <div>
              <p className="label">Platforms</p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((item) => {
                  const selected = edit.platforms.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setEdit({
                          ...edit,
                          platforms: selected
                            ? edit.platforms.filter((value) => value !== item)
                            : [...edit.platforms, item],
                        })
                      }
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                        selected
                          ? 'border-[#00ff88]/45 bg-[#00ff88]/12 text-[#00ff88]'
                          : 'border-white/10 bg-white/3 text-[#8b98a5] hover:text-white'
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
            {edit.post.status !== 'published' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="edit-status">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    className="select"
                    value={edit.status}
                    onChange={(event) => setEdit({ ...edit, status: event.target.value as 'draft' | 'scheduled' })}
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                {edit.status === 'scheduled' ? (
                  <div>
                    <label className="label" htmlFor="edit-when">
                      Scheduled for
                    </label>
                    <input
                      id="edit-when"
                      type="datetime-local"
                      className="input"
                      value={edit.scheduledAt}
                      onChange={(event) => setEdit({ ...edit, scheduledAt: event.target.value })}
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="rounded-lg border border-white/8 bg-white/3 px-3 py-2 text-xs text-[#8b98a5]">
                This post is already published. Editing changes the stored copy only.
              </p>
            )}
            <div>
              <label className="label" htmlFor="edit-tone">
                Tone
              </label>
              <select
                id="edit-tone"
                className="select"
                value={edit.tone}
                onChange={(event) => setEdit({ ...edit, tone: event.target.value as Tone })}
              >
                {toneOptions.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
