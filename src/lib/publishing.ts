import {
  addActivity,
  getPost,
  getRawAccount,
  isLinkedInAutoPostEnabled,
  logPublish,
  markPostFailed,
  markPostPublished,
  recordAnalytics,
  setAccountError,
} from './db';
import { getLinkedInRuntime, publishToLinkedIn } from './linkedin';
import type { Platform, Post } from './types';

export interface PlatformResult {
  platform: Platform;
  ok: boolean;
  mode: 'live' | 'demo' | 'unavailable';
  externalUrl?: string;
  detail: string;
}

export interface PublishResult {
  ok: boolean;
  post: Post;
  results: PlatformResult[];
}

function simulateMetrics(platform: Platform) {
  const base: Record<Platform, number> = {
    linkedin: 3200,
    x: 2100,
    instagram: 2600,
    facebook: 1200,
    tiktok: 3400,
    youtube: 1600,
  };
  const impressions = Math.round(base[platform] * (0.8 + Math.random() * 0.7));
  const likes = Math.round(impressions * (0.03 + Math.random() * 0.03));
  const comments = Math.round(likes * (0.08 + Math.random() * 0.08));
  const shares = Math.round(likes * (0.05 + Math.random() * 0.06));
  const clicks = Math.round(impressions * (0.007 + Math.random() * 0.008));
  return { impressions, likes, comments, shares, clicks };
}

export async function publishPost(
  id: number,
  options: { auto?: boolean } = {}
): Promise<PublishResult> {
  const post = getPost(id);
  if (!post) throw new Error('Post not found');
  if (post.status === 'published') {
    return {
      ok: true,
      post,
      results: post.platforms.map((platform) => ({
        platform,
        ok: true,
        mode: 'demo',
        detail: 'Already published.',
      })),
    };
  }
  if (post.platforms.length === 0) throw new Error('Post has no platforms');

  const results: PlatformResult[] = [];
  let total = { impressions: 0, likes: 0, comments: 0, shares: 0 };
  let externalUrl: string | null = null;

  for (const platform of post.platforms) {
    const account = getRawAccount(platform);
    if (!account || account.status !== 'connected') {
      const detail = `${platform} is not connected. Connect it in Settings first.`;
      results.push({ platform, ok: false, mode: 'unavailable', detail });
      logPublish({ postId: id, platform, mode: 'unavailable', ok: false, detail });
      continue;
    }

    if (platform === 'linkedin' && options.auto && !isLinkedInAutoPostEnabled()) {
      const detail = 'LinkedIn auto-posting is turned off in Settings.';
      results.push({ platform, ok: false, mode: 'unavailable', detail });
      logPublish({ postId: id, platform, mode: 'disabled', ok: false, detail });
      continue;
    }

    if (platform === 'linkedin') {
      const runtime = getLinkedInRuntime();
      if (runtime.mode === 'live' && runtime.accessToken && runtime.personUrn) {
        try {
          const published = await publishToLinkedIn({
            accessToken: runtime.accessToken,
            personUrn: runtime.personUrn,
            content: post.content,
            hashtags: post.hashtags,
          });
          const metrics = simulateMetrics(platform);
          total = {
            impressions: total.impressions + metrics.impressions,
            likes: total.likes + metrics.likes,
            comments: total.comments + metrics.comments,
            shares: total.shares + metrics.shares,
          };
          externalUrl = published.externalUrl;
          recordAnalytics(platform, metrics);
          results.push({
            platform,
            ok: true,
            mode: 'live',
            externalUrl: published.externalUrl,
            detail: 'Published to LinkedIn with the live API.',
          });
          logPublish({ postId: id, platform, mode: 'live', ok: true, detail: published.urn });
          continue;
        } catch (error) {
          const message = (error as Error).message;
          setAccountError(platform, message);
          results.push({ platform, ok: false, mode: 'live', detail: message });
          logPublish({ postId: id, platform, mode: 'live', ok: false, detail: message });
          continue;
        }
      }
    }

    const metrics = simulateMetrics(platform);
    total = {
      impressions: total.impressions + metrics.impressions,
      likes: total.likes + metrics.likes,
      comments: total.comments + metrics.comments,
      shares: total.shares + metrics.shares,
    };
    recordAnalytics(platform, metrics);
    const detail =
      platform === 'linkedin'
        ? 'Simulated LinkedIn publish (demo mode). Add OAuth credentials for a real post.'
        : `Simulated ${platform} publish in demo mode.`;
    results.push({ platform, ok: true, mode: 'demo', detail });
    logPublish({ postId: id, platform, mode: 'demo', ok: true, detail });
  }

  const successes = results.filter((result) => result.ok);
  if (successes.length === 0) {
    const message = results.map((result) => `${result.platform}: ${result.detail}`).join(' | ');
    markPostFailed(id, message);
    addActivity('fail', `Post #${id} failed to publish on every platform. ${message}`, id);
    return { ok: false, post: getPost(id)!, results };
  }

  markPostPublished(id, {
    publishedAt: new Date().toISOString(),
    externalUrl,
    impressions: total.impressions,
    likes: total.likes,
    comments: total.comments,
    shares: total.shares,
  });

  const platforms = successes.map((result) => result.platform).join(', ');
  const live = successes.some((result) => result.mode === 'live');
  addActivity(
    'publish',
    `${options.auto ? 'Auto-published' : 'Published'} post #${id} to ${platforms}${live ? ' (live LinkedIn post)' : ''}.`,
    id
  );

  return { ok: true, post: getPost(id)!, results };
}
