import {
  addActivity,
  dueScheduledPosts,
  getSetting,
  isAutopilotEnabled,
  setSetting,
} from './db';
import { publishPost } from './publishing';

type SchedulerGlobal = typeof globalThis & {
  __socialSaasSchedulerTimer?: NodeJS.Timeout;
  __socialSaasSchedulerBusy?: boolean;
};

export interface SchedulerStatus {
  enabled: boolean;
  autopilot: boolean;
  lastRun: string | null;
  publishedLastRun: number;
}

export function getSchedulerStatus(): SchedulerStatus {
  return {
    enabled: process.env.SCHEDULER_ENABLED !== 'false',
    autopilot: isAutopilotEnabled(),
    lastRun: getSetting('last_scheduler_run') || null,
    publishedLastRun: Number(getSetting('last_scheduler_published') || 0),
  };
}

export async function runDuePosts(trigger: 'scheduler' | 'manual' = 'scheduler', force = false): Promise<{
  published: number;
  failed: number;
  skipped: boolean;
  details: Array<{ id: number; ok: boolean }>;
}> {
  const globalRef = globalThis as SchedulerGlobal;
  if (globalRef.__socialSaasSchedulerBusy) {
    return { published: 0, failed: 0, skipped: true, details: [] };
  }
  if (!force && !isAutopilotEnabled()) {
    return { published: 0, failed: 0, skipped: true, details: [] };
  }

  globalRef.__socialSaasSchedulerBusy = true;
  try {
    const due = dueScheduledPosts();
    let published = 0;
    let failed = 0;
    const details: Array<{ id: number; ok: boolean }> = [];

    for (const post of due) {
      try {
        const result = await publishPost(post.id, { auto: true });
        details.push({ id: post.id, ok: result.ok });
        if (result.ok) published += 1;
        else failed += 1;
      } catch {
        failed += 1;
        details.push({ id: post.id, ok: false });
      }
    }

    setSetting('last_scheduler_run', new Date().toISOString());
    setSetting('last_scheduler_published', String(published));
    if (published > 0) {
      addActivity(
        'schedule',
        `${trigger === 'manual' ? 'Manual run' : 'Auto-pilot'} published ${published} due post${published === 1 ? '' : 's'}.`,
      );
    }
    return { published, failed, skipped: false, details };
  } finally {
    globalRef.__socialSaasSchedulerBusy = false;
  }
}

export function startScheduler(): void {
  const globalRef = globalThis as SchedulerGlobal;
  if (globalRef.__socialSaasSchedulerTimer) return;
  if (process.env.SCHEDULER_ENABLED === 'false') return;

  const interval = Math.max(Number(process.env.SCHEDULER_INTERVAL_MS || 30000), 5000);

  setTimeout(() => {
    void runDuePosts('scheduler');
  }, 5000).unref?.();

  const timer = setInterval(() => {
    void runDuePosts('scheduler');
  }, interval);
  timer.unref?.();

  globalRef.__socialSaasSchedulerTimer = timer;
  console.log(`[scheduler] started, checking due posts every ${interval}ms`);
}


