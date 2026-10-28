'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AlertIcon,
  CalendarIcon,
  CheckIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
  TrashIcon,
} from '@/components/icons';
import { Badge, ErrorBanner, PageHeader, PlatformBadge, Skeleton } from '@/components/ui';
import { api, cn, formatNumber, toLocalInputValue } from '@/lib/client';
import { PLATFORMS, PLATFORM_META } from '@/lib/types';
import type { GeneratedPost, Platform, Post, Tone } from '@/lib/types';

type Tab = 'ai' | 'manual';
type SaveMode = 'draft' | 'scheduled' | 'published';
type AiMode = { mode: 'live' | 'mock'; configured: boolean; keyMasked: string | null; keySource: string; model: string };

interface Preview {
  id: string;
  content: string;
  hashtags: string;
  platform: Platform;
  tone: Tone;
}

const toneOptions: Tone[] = ['professional', 'casual', 'funny', 'inspirational', 'bold'];

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function CreatePage() {
  const [tab, setTab] = useState<Tab>('ai');
  const [aiMode, setAiMode] = useState<AiMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [topic, setTopic] = useState('How founder-led content compounds into inbound leads');
  const [tone, setTone] = useState<Tone>('professional');
  const [platforms, setPlatforms] = useState<Platform[]>(['linkedin', 'x', 'instagram']);
  const [count, setCount] = useState(3);
  const [keywords, setKeywords] = useState('content strategy, automation, b2b');
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState<SaveMode | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');

  const [manualContent, setManualContent] = useState('');
  const [manualPlatforms, setManualPlatforms] = useState<Platform[]>(['linkedin']);
  const [manualTone, setManualTone] = useState<Tone>('professional');
  const [manualHashtags, setManualHashtags] = useState('');
  const [manualStatus, setManualStatus] = useState<'draft' | 'scheduled' | 'published'>('draft');
  const [manualWhen, setManualWhen] = useState('');
  const [manualBusy, setManualBusy] = useState(false);

  useEffect(() => {
    setScheduledAt(toLocalInputValue(null));
    setManualWhen(toLocalInputValue(null));
    fetch('/api/ai/status')
      .then((response) => response.json())
      .then((data) => setAiMode(data))
      .catch(() => setAiMode({ mode: 'mock', configured: false, keyMasked: null, keySource: 'none', model: 'local templates' }));
  }, []);

  const togglePlatform = (platform: Platform) => {
    setPlatforms((current) =>
      current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]
    );
  };

  const toggleManualPlatform = (platform: Platform) => {
    setManualPlatforms((current) =>
      current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]
    );
  };

  const generate = async () => {
    try {
      setGenerating(true);
      setError(null);
      setWarning(null);
      setNotice(null);
      if (!topic.trim()) throw new Error('Add a topic first');
      if (platforms.length === 0) throw new Error('Choose at least one platform');

      const result = await api<{
        posts: GeneratedPost[];
        mode: 'live' | 'mock';
        model: string;
        warning?: string;
      }>('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          topic,
          tone,
          platforms,
          count,
          keywords: keywords
            .split(',')
            .map((keyword) => keyword.trim())
            .filter(Boolean),
          save: 'none',
        }),
      });

      setPreviews(
        result.posts.map((post) => ({
          id: newId(),
          content: post.content,
          hashtags: post.hashtags.join(', '),
          platform: post.platform,
          tone: post.tone,
        }))
      );
      setWarning(result.warning ?? null);
      setNotice(
        `Generated ${result.posts.length} post${result.posts.length === 1 ? '' : 's'} with ${
          result.mode === 'live' ? `Groq (${result.model})` : 'the mock generator'
        }. Review, edit, then save.`
      );
    } catch (generateError) {
      setError((generateError as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const savePreviews = async (status: SaveMode) => {
    try {
      setSaving(status);
      setError(null);
      if (previews.length === 0) throw new Error('Generate or add a post first');
      if (status === 'scheduled' && !scheduledAt) throw new Error('Pick a schedule date and time');

      const result = await api<{ saved: Post[]; published: number }>('/api/posts/bulk', {
        method: 'POST',
        body: JSON.stringify({
          posts: previews.map((preview) => ({
            content: preview.content,
            hashtags: preview.hashtags,
            platforms: [preview.platform],
            tone: preview.tone,
          })),
          status,
          scheduledAt: status === 'scheduled' ? scheduledAt : null,
          topic,
          tone,
          source: 'ai',
        }),
      });

      setNotice(
        status === 'published'
          ? `Published ${result.published} of ${result.saved.length} posts.`
          : `Saved ${result.saved.length} post${result.saved.length === 1 ? '' : 's'} as ${status}.`
      );
      setPreviews([]);
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const removePreview = (id: string) => {
    setPreviews((current) => current.filter((preview) => preview.id !== id));
  };

  const addPreview = () => {
    setPreviews((current) => [
      ...current,
      {
        id: newId(),
        content: '',
        hashtags: '',
        platform: manualPlatforms[0] ?? 'linkedin',
        tone,
      },
    ]);
  };

  const submitManual = async () => {
    try {
      setManualBusy(true);
      setError(null);
      setNotice(null);
      if (!manualContent.trim()) throw new Error('Write some content first');
      if (manualPlatforms.length === 0) throw new Error('Choose at least one platform');
      if (manualStatus === 'scheduled' && !manualWhen) throw new Error('Pick a schedule date and time');

      const result = await api<{ post: Post; publish?: { ok: boolean } }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: manualContent,
          hashtags: manualHashtags,
          platforms: manualPlatforms,
          tone: manualTone,
          status: manualStatus,
          scheduledAt: manualStatus === 'scheduled' ? manualWhen : null,
        }),
      });

      setNotice(
        manualStatus === 'published'
          ? `Post #${result.post.id} published.`
          : manualStatus === 'scheduled'
            ? `Post #${result.post.id} scheduled.`
            : `Draft #${result.post.id} saved.`
      );
      setManualContent('');
      setManualHashtags('');
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setManualBusy(false);
    }
  };

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Create"
        description="Generate a batch with AI or write a single post by hand. Everything is saved to local SQLite."
        actions={
          <Link href="/posts" className="btn btn-secondary btn-sm">
            View posts
          </Link>
        }
      />

      {error ? <ErrorBanner message={error} /> : null}
      {notice ? (
        <div className="flex flex-col gap-2 rounded-xl border border-[#00ff88]/25 bg-[#00ff88]/8 px-4 py-3 text-sm text-[#8ae9bd] sm:flex-row sm:items-center sm:justify-between">
          <span>{notice}</span>
          <Link href="/posts" className="font-semibold text-[#00ff88] underline-offset-2 hover:underline">
            Open posts
          </Link>
        </div>
      ) : null}
      {warning ? (
        <div className="flex items-start gap-2 rounded-xl border border-[#f59e0b]/25 bg-[#f59e0b]/8 px-4 py-3 text-sm text-[#fcd34d]">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{warning}</span>
        </div>
      ) : null}

      <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => setTab('ai')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            tab === 'ai' ? 'bg-[#00ff88] text-[#041008]' : 'text-[#8b98a5] hover:text-white'
          )}
        >
          <SparklesIcon className="h-4 w-4" />
          AI batch
        </button>
        <button
          type="button"
          onClick={() => setTab('manual')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            tab === 'manual' ? 'bg-[#00ff88] text-[#041008]' : 'text-[#8b98a5] hover:text-white'
          )}
        >
          <PlusIcon className="h-4 w-4" />
          Manual post
        </button>
      </div>

      {tab === 'ai' ? (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
            <section className="card p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="topic">
                    Topic or angle
                  </label>
                  <input
                    id="topic"
                    className="input"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="What should this batch be about?"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="tone">
                    Tone
                  </label>
                  <select id="tone" className="select" value={tone} onChange={(event) => setTone(event.target.value as Tone)}>
                    {toneOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="keywords">
                    Keywords (comma separated)
                  </label>
                  <input
                    id="keywords"
                    className="input"
                    value={keywords}
                    onChange={(event) => setKeywords(event.target.value)}
                    placeholder="automation, b2b, content"
                  />
                </div>
                <div className="sm:col-span-2">
                  <p className="label">Platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((platform) => {
                      const selected = platforms.includes(platform);
                      return (
                        <button
                          key={platform}
                          type="button"
                          onClick={() => togglePlatform(platform)}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                            selected
                              ? 'border-[#00ff88]/45 bg-[#00ff88]/12 text-[#00ff88]'
                              : 'border-white/10 bg-white/3 text-[#8b98a5] hover:text-white'
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: PLATFORM_META[platform].color }} />
                          {PLATFORM_META[platform].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="label" htmlFor="count">
                      Number of posts
                    </label>
                    <span className="pill text-[#00ff88]">{count}</span>
                  </div>
                  <input
                    id="count"
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={count}
                    onChange={(event) => setCount(Number(event.target.value))}
                    className="w-full accent-[#00ff88]"
                  />
                  <p className="mt-1 text-[11px] text-[#6b7785]">Posts rotate across the selected platforms.</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/6 pt-4">
                <button type="button" className="btn btn-primary" onClick={() => void generate()} disabled={generating}>
                  <SparklesIcon className="h-4 w-4" />
                  {generating ? 'Generating...' : 'Generate posts'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={addPreview} disabled={generating}>
                  <PlusIcon className="h-4 w-4" />
                  Add blank
                </button>
                {previews.length ? (
                  <span className="text-xs text-[#8b98a5]">
                    {previews.length} preview{previews.length === 1 ? '' : 's'}
                  </span>
                ) : null}
              </div>
            </section>

            <aside className="card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-white">AI engine</h2>
                <Badge tone={aiMode?.mode === 'live' ? 'success' : 'violet'}>
                  {aiMode ? (aiMode.mode === 'live' ? 'Groq live' : 'Mock mode') : 'Checking'}
                </Badge>
              </div>
              <div className="mt-4 space-y-3 text-xs text-[#8b98a5]">
                <div className="flex items-center justify-between">
                  <span>Model</span>
                  <span className="text-[#c9d3dc]">{aiMode?.mode === 'live' ? aiMode.model : 'local templates'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Key source</span>
                  <span className="text-[#c9d3dc]">{aiMode?.keySource ?? 'none'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Key</span>
                  <span className="text-[#c9d3dc]">{aiMode?.keyMasked ?? 'not set'}</span>
                </div>
              </div>
              {aiMode?.mode === 'mock' ? (
                <p className="mt-4 rounded-lg border border-[#8b5cf6]/25 bg-[#8b5cf6]/8 px-3 py-2 text-xs text-[#c4b5fd]">
                  Add a Groq API key in Settings to switch to live generation. The app keeps working without one.
                </p>
              ) : null}
              <div className="mt-4 space-y-2 border-t border-white/6 pt-4 text-xs text-[#8b98a5]">
                <p className="font-semibold text-white">Good prompts</p>
                <p>Name a specific audience and a concrete outcome. Mention a real number if you have one.</p>
                <p>Example: "Why B2B founders should publish customer objections, with a 30-day experiment."</p>
              </div>
            </aside>
          </div>

          {generating ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="card space-y-3 p-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : null}

          {previews.length > 0 ? (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-white">Preview & edit</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5">
                    <CalendarIcon className="h-4 w-4 text-[#8b98a5]" />
                    <input
                      type="datetime-local"
                      className="bg-transparent text-xs text-white outline-none"
                      value={scheduledAt}
                      onChange={(event) => setScheduledAt(event.target.value)}
                      aria-label="Schedule start"
                    />
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => void savePreviews('draft')} disabled={Boolean(saving)}>
                    {saving === 'draft' ? 'Saving...' : 'Save drafts'}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => void savePreviews('scheduled')} disabled={Boolean(saving)}>
                    {saving === 'scheduled' ? 'Scheduling...' : 'Schedule all'}
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => void savePreviews('published')} disabled={Boolean(saving)}>
                    <SendIcon className="h-3.5 w-3.5" />
                    {saving === 'published' ? 'Publishing...' : 'Publish all'}
                  </button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {previews.map((preview) => {
                  const limit = PLATFORM_META[preview.platform].limit;
                  const over = preview.content.length > limit;
                  return (
                    <article key={preview.id} className="card flex flex-col p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <select
                          className="select w-auto py-1.5 text-xs"
                          value={preview.platform}
                          onChange={(event) =>
                            setPreviews((current) =>
                              current.map((item) =>
                                item.id === preview.id ? { ...item, platform: event.target.value as Platform } : item
                              )
                            )
                          }
                          aria-label="Preview platform"
                        >
                          {PLATFORMS.map((platform) => (
                            <option key={platform} value={platform}>
                              {PLATFORM_META[platform].label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => removePreview(preview.id)}
                          aria-label="Remove preview"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <textarea
                        className="textarea flex-1 text-sm"
                        value={preview.content}
                        onChange={(event) =>
                          setPreviews((current) =>
                            current.map((item) =>
                              item.id === preview.id ? { ...item, content: event.target.value } : item
                            )
                          )
                        }
                        placeholder="Write or edit the caption..."
                      />
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className={over ? 'font-semibold text-[#fca5a5]' : 'text-[#6b7785]'}>
                          {preview.content.length}/{formatNumber(limit)}
                        </span>
                        <PlatformBadge platform={preview.platform} />
                      </div>
                      <input
                        className="input mt-2 text-xs"
                        value={preview.hashtags}
                        onChange={(event) =>
                          setPreviews((current) =>
                            current.map((item) =>
                              item.id === preview.id ? { ...item, hashtags: event.target.value } : item
                            )
                          )
                        }
                        placeholder="hashtags, comma separated"
                      />
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          <section className="card p-5">
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="manual-content">
                  Content
                </label>
                <textarea
                  id="manual-content"
                  className="textarea min-h-[220px]"
                  value={manualContent}
                  onChange={(event) => setManualContent(event.target.value)}
                  placeholder="Write the post exactly how you want it published..."
                />
                <p className="mt-1 text-[11px] text-[#6b7785]">{manualContent.length} characters</p>
              </div>
              <div>
                <p className="label">Platforms</p>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => {
                    const selected = manualPlatforms.includes(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => toggleManualPlatform(platform)}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                          selected
                            ? 'border-[#00ff88]/45 bg-[#00ff88]/12 text-[#00ff88]'
                            : 'border-white/10 bg-white/3 text-[#8b98a5] hover:text-white'
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: PLATFORM_META[platform].color }} />
                        {PLATFORM_META[platform].label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="manual-tone">
                    Tone
                  </label>
                  <select
                    id="manual-tone"
                    className="select"
                    value={manualTone}
                    onChange={(event) => setManualTone(event.target.value as Tone)}
                  >
                    {toneOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="manual-hashtags">
                    Hashtags
                  </label>
                  <input
                    id="manual-hashtags"
                    className="input"
                    value={manualHashtags}
                    onChange={(event) => setManualHashtags(event.target.value)}
                    placeholder="marketing, growth"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="manual-status">
                    Status
                  </label>
                  <select
                    id="manual-status"
                    className="select"
                    value={manualStatus}
                    onChange={(event) => setManualStatus(event.target.value as 'draft' | 'scheduled' | 'published')}
                  >
                    <option value="draft">Save as draft</option>
                    <option value="scheduled">Schedule</option>
                    <option value="published">Publish now</option>
                  </select>
                </div>
                {manualStatus === 'scheduled' ? (
                  <div>
                    <label className="label" htmlFor="manual-when">
                      Scheduled for
                    </label>
                    <input
                      id="manual-when"
                      type="datetime-local"
                      className="input"
                      value={manualWhen}
                      onChange={(event) => setManualWhen(event.target.value)}
                    />
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-white/6 pt-4">
                <button type="button" className="btn btn-primary" onClick={() => void submitManual()} disabled={manualBusy}>
                  <CheckIcon className="h-4 w-4" />
                  {manualBusy
                    ? 'Saving...'
                    : manualStatus === 'published'
                      ? 'Publish now'
                      : manualStatus === 'scheduled'
                        ? 'Schedule post'
                        : 'Save draft'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setManualContent('');
                    setManualHashtags('');
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </section>
          <aside className="card p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-white">Publishing behavior</h2>
            <div className="mt-4 space-y-3 text-xs text-[#8b98a5]">
              <p>
                <span className="font-semibold text-white">Publish now</span> sends the post through the publisher.
                LinkedIn uses the live API when connected, otherwise it simulates the result.
              </p>
              <p>
                <span className="font-semibold text-white">Schedule</span> stores the post and the background
                scheduler publishes it when due, as long as autopilot is on.
              </p>
              <p>
                <span className="font-semibold text-white">Drafts</span> stay local until you publish from the Posts
                page.
              </p>
            </div>
            <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-3 text-xs text-[#8b98a5]">
              <p className="font-semibold text-white">LinkedIn note</p>
              <p className="mt-1">
                Real posting needs a LinkedIn app with the Share on LinkedIn and OpenID Connect products. Add the
                credentials in Settings.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

