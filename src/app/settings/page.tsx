'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertIcon, CheckIcon, LinkedInIcon, RefreshIcon, SparklesIcon } from '@/components/icons';
import {
  Badge,
  ErrorBanner,
  PageHeader,
  PlatformBadge,
  SectionCard,
  Toggle,
} from '@/components/ui';
import { api, formatDateTime, relativeTime } from '@/lib/client';
import type { Account, Platform, Profile, Tone } from '@/lib/types';

interface SettingsPayload {
  ai: { mode: 'live' | 'mock'; configured: boolean; keyMasked: string | null; keySource: string; forceMock: boolean; model: string };
  autopilot: boolean;
  linkedinAutoPost: boolean;
  scheduler: { enabled: boolean; autopilot: boolean; lastRun: string | null; publishedLastRun: number };
  linkedin: {
    configured: boolean;
    redirectUri: string;
    version: string;
    forceDemo: boolean;
    runtime: { available: boolean; mode: 'live' | 'demo'; reason: string; personUrn: string | null; expiresAt: string | null };
  };
  appUrl: string;
}

interface PublishLogEntry {
  id: number;
  postId: number;
  platform: Platform;
  mode: string;
  ok: boolean;
  detail: string | null;
  createdAt: string;
}

const toneOptions: Tone[] = ['professional', 'casual', 'funny', 'inspirational', 'bold'];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [log, setLog] = useState<PublishLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [groqKey, setGroqKey] = useState('');
  const [profileForm, setProfileForm] = useState<Profile | null>(null);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [settingsData, accountsData, profileData, logData] = await Promise.all([
        api<SettingsPayload>('/api/settings'),
        api<{ accounts: Account[] }>('/api/accounts'),
        api<{ profile: Profile }>('/api/profile'),
        api<{ entries: PublishLogEntry[] }>('/api/publish-log?limit=15'),
      ]);
      setSettings(settingsData);
      setAccounts(accountsData.accounts);
      setProfileForm(profileData.profile);
      setLog(logData.entries);
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedin = params.get('linkedin');
    if (!linkedin) return;
    if (linkedin === 'connected') {
      setNotice('LinkedIn connected. Auto-posting will use the live LinkedIn API.');
    } else if (linkedin === 'unconfigured') {
      setError(
        'LinkedIn is not configured yet. Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET, then restart the app.'
      );
    } else if (linkedin === 'error') {
      setError(params.get('message') || 'LinkedIn connection failed.');
    }
    window.history.replaceState({}, '', '/settings');
  }, []);

  const patchSettings = async (body: Record<string, unknown>, key: string) => {
    try {
      setBusy(key);
      setError(null);
      setNotice(null);
      const next = await api<SettingsPayload>('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setSettings(next);
      setNotice('Settings updated.');
    } catch (patchError) {
      setError((patchError as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const saveGroq = async () => {
    if (!groqKey.trim()) {
      await patchSettings({ groqApiKey: '' }, 'groq');
      setGroqKey('');
      return;
    }
    await patchSettings({ groqApiKey: groqKey.trim() }, 'groq');
    setGroqKey('');
  };

  const saveProfile = async () => {
    if (!profileForm) return;
    try {
      setBusy('profile');
      setError(null);
      setNotice(null);
      const result = await api<{ profile: Profile }>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileForm),
      });
      setProfileForm(result.profile);
      setNotice('Brand profile saved.');
    } catch (profileError) {
      setError((profileError as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const accountAction = async (platform: Platform, action: 'disconnect' | 'connect-demo') => {
    try {
      setBusy(`${platform}-${action}`);
      setError(null);
      setNotice(null);
      const result = await api<{ accounts: Account[] }>(`/api/accounts/${platform}/${action}`, { method: 'POST' });
      setAccounts(result.accounts);
      setNotice(action === 'disconnect' ? `${platform} disconnected.` : `${platform} reconnected in demo mode.`);
      await loadAll();
    } catch (actionError) {
      setError((actionError as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const runScheduler = async () => {
    try {
      setBusy('scheduler');
      setError(null);
      setNotice(null);
      const result = await api<{ published: number; failed: number }>('/api/scheduler/run', { method: 'POST' });
      setNotice(
        result.published > 0
          ? `Scheduler published ${result.published} post${result.published === 1 ? '' : 's'}.`
          : 'No due posts. The queue is empty.'
      );
      await loadAll();
    } catch (schedulerError) {
      setError((schedulerError as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const resetData = async () => {
    if (!window.confirm('Reset all demo data? This deletes your local posts, analytics, and accounts, then reseeds.')) {
      return;
    }
    try {
      setBusy('reset');
      setError(null);
      await api('/api/seed/reset', { method: 'POST' });
      setNotice('Demo data reset to the original seeded state.');
      await loadAll();
    } catch (resetError) {
      setError((resetError as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const copyRedirect = async () => {
    if (!settings) return;
    try {
      await navigator.clipboard.writeText(settings.linkedin.redirectUri);
      setNotice('Redirect URL copied. Add it to your LinkedIn app.');
    } catch {
      setError('Could not copy to clipboard. Select the URL manually.');
    }
  };

  if (!settings || !profileForm) {
    return <ErrorBanner message={error ?? 'Loading settings...'} onRetry={loadAll} />;
  }

  const linkedinAccount = accounts.find((account) => account.platform === 'linkedin');
  const linkedinRuntime = settings.linkedin.runtime;

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Settings"
        description="Control AI keys, auto-posting, LinkedIn, your brand profile, and local demo data."
        actions={
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void loadAll()}>
            <RefreshIcon className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      {error ? <ErrorBanner message={error} onRetry={loadAll} /> : null}
      {notice ? (
        <div className="rounded-xl border border-[#00ff88]/25 bg-[#00ff88]/8 px-4 py-3 text-sm text-[#8ae9bd]">{notice}</div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="LinkedIn auto-posting"
          description="Connect once and scheduled LinkedIn posts publish automatically."
          action={
            <Badge
              tone={
                linkedinRuntime.mode === 'live'
                  ? 'success'
                  : linkedinRuntime.available
                    ? 'violet'
                    : 'warning'
              }
            >
              {linkedinRuntime.mode === 'live' ? 'Live API' : linkedinRuntime.available ? 'Demo mode' : 'Not connected'}
            </Badge>
          }
        >
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a66c2]/15 text-[#4ea3e8]">
                <LinkedInIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                  {linkedinAccount?.displayName || 'LinkedIn'}
                  {linkedinAccount?.handle ? <span className="ml-2 text-xs font-normal text-[#8b98a5]">{linkedinAccount.handle}</span> : null}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#8b98a5]">{linkedinRuntime.reason}</p>
                {linkedinRuntime.expiresAt ? (
                  <p className="mt-1 text-[11px] text-[#6b7785]">Token expires {formatDateTime(linkedinRuntime.expiresAt)}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {settings.linkedin.configured ? (
                <a href="/api/auth/linkedin" className="btn btn-primary btn-sm">
                  <LinkedInIcon className="h-4 w-4" />
                  {linkedinAccount?.mode === 'live' ? 'Reconnect LinkedIn' : 'Connect LinkedIn'}
                </a>
              ) : (
                <button type="button" className="btn btn-secondary btn-sm" disabled title="Add credentials in .env.local first">
                  <LinkedInIcon className="h-4 w-4" />
                  Connect LinkedIn
                </button>
              )}
              {linkedinAccount?.status === 'connected' ? (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => void accountAction('linkedin', 'disconnect')}
                  disabled={busy === 'linkedin-disconnect'}
                >
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => void accountAction('linkedin', 'connect-demo')}
                  disabled={busy === 'linkedin-connect-demo'}
                >
                  Reconnect demo
                </button>
              )}
            </div>
          </div>

            {!settings.linkedin.configured ? (
              <p className="mt-3 rounded-lg border border-[#f59e0b]/25 bg-[#f59e0b]/8 px-3 py-2 text-[11px] text-[#fcd34d]">
                OAuth credentials are not configured yet. Demo auto-posting still works; add LINKEDIN_CLIENT_ID and
                LINKEDIN_CLIENT_SECRET to .env.local, then restart for live posting.
              </p>
            ) : null}

          <div className="mt-4 space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs text-[#8b98a5]">
            <p className="font-semibold text-white">Setup checklist</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Create an app at linkedin.com/developers/apps.</li>
              <li>Request "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect".</li>
              <li>Add the redirect URL below to the app's auth settings.</li>
              <li>Put the client id and secret in .env.local and restart.</li>
            </ol>
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
              <code className="flex-1 overflow-x-auto rounded-lg border border-white/8 bg-black/30 px-2.5 py-2 text-[11px] text-[#c9d3dc]">
                {settings.linkedin.redirectUri}
              </code>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => void copyRedirect()}>
                Copy
              </button>
            </div>
            <p>API version: {settings.linkedin.version}</p>
          </div>

          <div className="mt-4 border-t border-white/6 pt-4">
            <Toggle
              checked={settings.linkedinAutoPost}
              onChange={(next) => void patchSettings({ linkedinAutoPost: next }, 'linkedin-auto')}
              label="Auto-post LinkedIn on schedule"
              description="When off, scheduled LinkedIn posts stay in the queue even if autopilot is on."
              disabled={busy === 'linkedin-auto'}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="AI generation"
          description="Groq powers live generation. Without a key the app uses realistic mock templates."
          action={<Badge tone={settings.ai.mode === 'live' ? 'success' : 'violet'}>{settings.ai.mode === 'live' ? 'Groq live' : 'Mock mode'}</Badge>}
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
              <span className="text-[#8b98a5]">Model</span>
              <span className="text-[#c9d3dc]">{settings.ai.model}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
              <span className="text-[#8b98a5]">Current key</span>
              <span className="font-mono text-[#c9d3dc]">{settings.ai.keyMasked ?? 'none'}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
              <span className="text-[#8b98a5]">Key source</span>
              <span className="text-[#c9d3dc]">{settings.ai.keySource}</span>
            </div>
            <div>
              <label className="label" htmlFor="groq-key">
                Save a Groq API key locally
              </label>
              <input
                id="groq-key"
                type="password"
                className="input"
                value={groqKey}
                onChange={(event) => setGroqKey(event.target.value)}
                placeholder="gsk_..."
                autoComplete="off"
              />
              <p className="mt-1 text-[11px] text-[#6b7785]">
                Stored in the local SQLite database. A key in .env.local takes priority. Get one at console.groq.com/keys.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => void saveGroq()} disabled={busy === 'groq'}>
                <SparklesIcon className="h-4 w-4" />
                {busy === 'groq' ? 'Saving...' : 'Save key'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => void patchSettings({ groqApiKey: '' }, 'groq-clear')}
                disabled={busy === 'groq-clear'}
              >
                Clear local key
              </button>
            </div>
            {settings.ai.forceMock ? (
              <p className="rounded-lg border border-[#f59e0b]/25 bg-[#f59e0b]/8 px-3 py-2 text-[#fcd34d]">
                GROQ_FORCE_MOCK is enabled, so mock mode stays on even with a key.
              </p>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Automation"
          description="The scheduler checks due posts in the background."
          action={<Badge tone={settings.autopilot ? 'success' : 'warning'}>{settings.autopilot ? 'Autopilot on' : 'Paused'}</Badge>}
        >
          <div className="space-y-4">
            <Toggle
              checked={settings.autopilot}
              onChange={(next) => void patchSettings({ autopilot: next }, 'autopilot')}
              label="Autopilot"
              description="Automatically publish scheduled posts when their time arrives."
              disabled={busy === 'autopilot'}
            />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                <p className="text-[10.5px] uppercase tracking-[0.07em] text-[#6b7785]">Last run</p>
                <p className="mt-1 text-[#c9d3dc]">{settings.scheduler.lastRun ? relativeTime(settings.scheduler.lastRun) : 'Never'}</p>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                <p className="text-[10.5px] uppercase tracking-[0.07em] text-[#6b7785]">Published last run</p>
                <p className="mt-1 text-[#c9d3dc]">{settings.scheduler.publishedLastRun}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => void runScheduler()} disabled={busy === 'scheduler'}>
                <RefreshIcon className="h-4 w-4" />
                Run scheduler now
              </button>
              <Link href="/calendar" className="btn btn-ghost btn-sm">
                View queue
              </Link>
            </div>
            <p className="text-[11px] text-[#6b7785]">
              Background checks run every {process.env.NEXT_PUBLIC_SCHEDULER_LABEL ?? '30 seconds'} while the server is on.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Connected platforms" description="Demo connections simulate publishing without OAuth.">
          <div className="space-y-2">
            {accounts.map((account) => (
              <div key={account.platform} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                <div className="flex items-center gap-2">
                  <PlatformBadge platform={account.platform} />
                  <span className="text-xs text-[#8b98a5]">{account.handle}</span>
                  <Badge tone={account.status === 'connected' ? 'success' : 'neutral'}>
                    {account.status === 'connected' ? (account.mode === 'live' ? 'Live' : 'Demo') : 'Off'}
                  </Badge>
                </div>
                {account.status === 'connected' ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void accountAction(account.platform, 'disconnect')}
                    disabled={busy === `${account.platform}-disconnect`}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => void accountAction(account.platform, 'connect-demo')}
                    disabled={busy === `${account.platform}-connect-demo`}
                  >
                    Connect demo
                  </button>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Brand profile" description="Used as context for AI generation and shown across the dashboard.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="profile-name">
              Name
            </label>
            <input
              id="profile-name"
              className="input"
              value={profileForm.name}
              onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="profile-email">
              Email
            </label>
            <input
              id="profile-email"
              className="input"
              value={profileForm.email}
              onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="profile-company">
              Company
            </label>
            <input
              id="profile-company"
              className="input"
              value={profileForm.company}
              onChange={(event) => setProfileForm({ ...profileForm, company: event.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="profile-role">
              Role
            </label>
            <input
              id="profile-role"
              className="input"
              value={profileForm.role}
              onChange={(event) => setProfileForm({ ...profileForm, role: event.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="profile-niche">
              Niche
            </label>
            <input
              id="profile-niche"
              className="input"
              value={profileForm.niche}
              onChange={(event) => setProfileForm({ ...profileForm, niche: event.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="profile-website">
              Website
            </label>
            <input
              id="profile-website"
              className="input"
              value={profileForm.website}
              onChange={(event) => setProfileForm({ ...profileForm, website: event.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="profile-tone">
              Default tone
            </label>
            <select
              id="profile-tone"
              className="select"
              value={profileForm.tone}
              onChange={(event) => setProfileForm({ ...profileForm, tone: event.target.value as Tone })}
            >
              {toneOptions.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="profile-followers">
              Followers
            </label>
            <input
              id="profile-followers"
              type="number"
              min={0}
              className="input"
              value={profileForm.followers}
              onChange={(event) => setProfileForm({ ...profileForm, followers: Number(event.target.value) })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="profile-voice">
              Brand voice
            </label>
            <textarea
              id="profile-voice"
              className="textarea"
              value={profileForm.brandVoice}
              onChange={(event) => setProfileForm({ ...profileForm, brandVoice: event.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="profile-signature">
              Signature
            </label>
            <input
              id="profile-signature"
              className="input"
              value={profileForm.signature}
              onChange={(event) => setProfileForm({ ...profileForm, signature: event.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/6 pt-4">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void saveProfile()} disabled={busy === 'profile'}>
            <CheckIcon className="h-4 w-4" />
            {busy === 'profile' ? 'Saving...' : 'Save profile'}
          </button>
          <span className="text-[11px] text-[#6b7785]">Last updated {relativeTime(profileForm.updatedAt)}</span>
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Publish log" description="The last 15 publish attempts, live or simulated.">
          {log.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-[#8b98a5]">
              Nothing published yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/8 text-[10.5px] uppercase tracking-[0.07em] text-[#5d6a77]">
                    <th className="py-2 pr-3 font-semibold">Post</th>
                    <th className="py-2 pr-3 font-semibold">Platform</th>
                    <th className="py-2 pr-3 font-semibold">Mode</th>
                    <th className="py-2 pr-3 font-semibold">Result</th>
                    <th className="py-2 font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((entry) => (
                    <tr key={entry.id} className="border-b border-white/5 last:border-0">
                      <td className="py-2 pr-3 text-[#c9d3dc]">#{entry.postId}</td>
                      <td className="py-2 pr-3 text-[#c9d3dc]">
                        <PlatformBadge platform={entry.platform} />
                      </td>
                      <td className="py-2 pr-3 text-[#8b98a5]">{entry.mode}</td>
                      <td className="py-2 pr-3">
                        <span className={entry.ok ? 'text-[#00ff88]' : 'text-[#fca5a5]'}>{entry.ok ? 'OK' : 'Failed'}</span>
                      </td>
                      <td className="py-2 text-[#8b98a5]">{relativeTime(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Local data" description="Everything lives in data/app.db on your machine.">
          <div className="space-y-3 text-xs text-[#8b98a5]">
            <p>
              The SQLite database is created automatically on first run and seeded with demo posts, accounts, and
              analytics. Resetting restores the original demo data.
            </p>
            <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2 font-mono text-[11px] text-[#c9d3dc]">
              data/app.db
            </div>
            <p className="flex items-start gap-2 text-[#fcd34d]">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              Delete the file with the app stopped to start completely fresh.
            </p>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => void resetData()} disabled={busy === 'reset'}>
              {busy === 'reset' ? 'Resetting...' : 'Reset demo data'}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

