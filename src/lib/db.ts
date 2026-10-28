import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { seedDatabase } from './seed';
import type {
  Account,
  AccountMeta,
  ActivityItem,
  AnalyticsPoint,
  CreatePostInput,
  Platform,
  PlatformAnalytics,
  Post,
  PostStatus,
  Profile,
  Tone,
} from './types';
import { PLATFORMS } from './types';

type GlobalWithDb = typeof globalThis & {
  __socialSaasDb?: Database.Database;
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  niche TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  tone TEXT NOT NULL DEFAULT 'professional',
  brand_voice TEXT NOT NULL DEFAULT '',
  signature TEXT NOT NULL DEFAULT '',
  followers INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL UNIQUE,
  handle TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'connected',
  mode TEXT NOT NULL DEFAULT 'demo',
  access_token TEXT,
  refresh_token TEXT,
  expires_at TEXT,
  meta TEXT NOT NULL DEFAULT '{}',
  connected_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  hashtags TEXT NOT NULL DEFAULT '[]',
  platforms TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  tone TEXT,
  topic TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  scheduled_at TEXT,
  published_at TEXT,
  external_url TEXT,
  error TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_at);

CREATE TABLE IF NOT EXISTS analytics_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  platform TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  UNIQUE(date, platform)
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  post_id INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS publish_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  mode TEXT NOT NULL,
  ok INTEGER NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL
);
`;

const TABLES = [
  'publish_log',
  'oauth_states',
  'settings',
  'activity',
  'analytics_daily',
  'posts',
  'accounts',
  'profile',
];

export function getDb(): Database.Database {
  const globalRef = globalThis as GlobalWithDb;
  if (globalRef.__socialSaasDb) return globalRef.__socialSaasDb;

  const dataDir = path.join(process.cwd(), process.env.DATA_DIR || 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, 'app.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  seedDatabase(db);
  globalRef.__socialSaasDb = db;
  return db;
}

export function resetDatabase(): void {
  const db = getDb();
  for (const table of TABLES) {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
  }
  db.exec(SCHEMA);
  seedDatabase(db);
  addActivity('settings', 'Demo data reset to the original seeded state.');
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toPost(row: Record<string, unknown>): Post {
  return {
    id: Number(row.id),
    content: String(row.content),
    hashtags: parseJson<string[]>(row.hashtags as string, []),
    platforms: parseJson<Platform[]>(row.platforms as string, []),
    status: row.status as PostStatus,
    tone: (row.tone as Tone | null) ?? null,
    topic: (row.topic as string | null) ?? null,
    source: row.source as Post['source'],
    scheduledAt: (row.scheduled_at as string | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
    externalUrl: (row.external_url as string | null) ?? null,
    error: (row.error as string | null) ?? null,
    likes: Number(row.likes),
    comments: Number(row.comments),
    shares: Number(row.shares),
    impressions: Number(row.impressions),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function getProfile(): Profile {
  const row = getDb().prepare('SELECT * FROM profile WHERE id = 1').get() as Record<string, unknown>;
  return {
    id: 1,
    name: String(row.name),
    email: String(row.email),
    company: String(row.company),
    role: String(row.role),
    niche: String(row.niche),
    website: String(row.website),
    tone: row.tone as Tone,
    brandVoice: String(row.brand_voice),
    signature: String(row.signature),
    followers: Number(row.followers),
    updatedAt: String(row.updated_at),
  };
}

export function updateProfile(input: Partial<Omit<Profile, 'id' | 'updatedAt'>>): Profile {
  const current = getProfile();
  const next = { ...current, updatedAt: new Date().toISOString() };
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  getDb()
    .prepare(
      `UPDATE profile SET name = ?, email = ?, company = ?, role = ?, niche = ?, website = ?,
       tone = ?, brand_voice = ?, signature = ?, followers = ?, updated_at = ? WHERE id = 1`
    )
    .run(
      next.name,
      next.email,
      next.company,
      next.role,
      next.niche,
      next.website,
      next.tone,
      next.brandVoice,
      next.signature,
      next.followers,
      next.updatedAt
    );
  return getProfile();
}

export function listAccounts(): Account[] {
  const rows = getDb().prepare('SELECT * FROM accounts ORDER BY id').all() as Record<string, unknown>[];
  return rows.map((row) => ({
    id: Number(row.id),
    platform: row.platform as Platform,
    handle: String(row.handle),
    displayName: String(row.display_name),
    status: row.status as Account['status'],
    mode: row.mode as Account['mode'],
    expiresAt: (row.expires_at as string | null) ?? null,
    hasToken: Boolean(row.access_token),
    meta: parseJson<AccountMeta>(row.meta as string, {}),
    connectedAt: (row.connected_at as string | null) ?? null,
    updatedAt: String(row.updated_at),
  }));
}

export interface RawAccount {
  id: number;
  platform: Platform;
  handle: string;
  displayName: string;
  status: Account['status'];
  mode: Account['mode'];
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  meta: AccountMeta;
}

export function getRawAccount(platform: Platform): RawAccount | null {
  const row = getDb().prepare('SELECT * FROM accounts WHERE platform = ?').get(platform) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;
  return {
    id: Number(row.id),
    platform: row.platform as Platform,
    handle: String(row.handle),
    displayName: String(row.display_name),
    status: row.status as Account['status'],
    mode: row.mode as Account['mode'],
    accessToken: (row.access_token as string | null) ?? null,
    refreshToken: (row.refresh_token as string | null) ?? null,
    expiresAt: (row.expires_at as string | null) ?? null,
    meta: parseJson<AccountMeta>(row.meta as string, {}),
  };
}

export function saveConnectedAccount(input: {
  platform: Platform;
  handle: string;
  displayName: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  meta?: AccountMeta;
}): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO accounts (platform, handle, display_name, status, mode, access_token, refresh_token, expires_at, meta, connected_at, updated_at)
       VALUES (?, ?, ?, 'connected', 'live', ?, ?, ?, ?, ?, ?)
       ON CONFLICT(platform) DO UPDATE SET
         handle = excluded.handle,
         display_name = excluded.display_name,
         status = 'connected',
         mode = 'live',
         access_token = excluded.access_token,
         refresh_token = excluded.refresh_token,
         expires_at = excluded.expires_at,
         meta = excluded.meta,
         connected_at = excluded.connected_at,
         updated_at = excluded.updated_at`
    )
    .run(
      input.platform,
      input.handle,
      input.displayName,
      input.accessToken,
      input.refreshToken ?? null,
      input.expiresAt ?? null,
      JSON.stringify(input.meta ?? {}),
      now,
      now
    );
}

export function disconnectAccount(platform: Platform): void {
  getDb()
    .prepare(
      `UPDATE accounts SET status = 'disconnected', mode = 'demo', access_token = NULL,
       refresh_token = NULL, expires_at = NULL, updated_at = ? WHERE platform = ?`
    )
    .run(new Date().toISOString(), platform);
  addActivity('connect', `${platform} disconnected. Auto-posting for this platform is paused.`);
}

export function connectDemoAccount(platform: Platform): void {
  const account = getRawAccount(platform);
  const now = new Date().toISOString();
  if (!account) {
    getDb()
      .prepare(
        `INSERT INTO accounts (platform, handle, display_name, status, mode, meta, connected_at, updated_at)
         VALUES (?, ?, ?, 'connected', 'demo', '{}', ?, ?)`
      )
      .run(platform, `@${platform}`, platform, now, now);
  } else {
    getDb()
      .prepare(
        `UPDATE accounts SET status = 'connected', mode = 'demo', access_token = NULL,
         refresh_token = NULL, expires_at = NULL, updated_at = ? WHERE platform = ?`
      )
      .run(now, platform);
  }
  addActivity('connect', `${platform} reconnected in demo mode.`);
}

export function setAccountError(platform: Platform, message: string): void {
  const account = getRawAccount(platform);
  const meta = { ...(account?.meta ?? {}), lastError: message };
  getDb()
    .prepare('UPDATE accounts SET meta = ?, updated_at = ? WHERE platform = ?')
    .run(JSON.stringify(meta), new Date().toISOString(), platform);
}

export interface PostFilters {
  status?: string;
  platform?: string;
  q?: string;
  limit?: number;
}

export function listPosts(filters: PostFilters = {}): Post[] {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters.status && filters.status !== 'all') {
    clauses.push('status = ?');
    params.push(filters.status);
  }
  if (filters.platform && filters.platform !== 'all') {
    clauses.push('platforms LIKE ?');
    params.push(`%"${filters.platform}"%`);
  }
  if (filters.q) {
    clauses.push('(content LIKE ? OR topic LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = Math.min(Math.max(filters.limit ?? 200, 1), 500);
  const rows = getDb()
    .prepare(`SELECT * FROM posts ${where} ORDER BY COALESCE(published_at, scheduled_at, created_at) DESC LIMIT ?`)
    .all(...params, limit) as Record<string, unknown>[];
  return rows.map(toPost);
}

export function getPost(id: number): Post | null {
  const row = getDb().prepare('SELECT * FROM posts WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? toPost(row) : null;
}

export function createPost(input: CreatePostInput): Post {
  const now = new Date().toISOString();
  const status: PostStatus = input.status ?? 'draft';
  const platforms = input.platforms.filter((p) => (PLATFORMS as readonly string[]).includes(p));
  if (!input.content.trim()) throw new Error('Content is required');
  if (platforms.length === 0) throw new Error('Choose at least one platform');
  if (status === 'scheduled' && !input.scheduledAt) throw new Error('Scheduled posts need a date and time');

  const scheduledAt = status === 'scheduled' ? input.scheduledAt ?? null : null;
  const publishedAt = status === 'published' ? now : null;

  const result = getDb()
    .prepare(
      `INSERT INTO posts (content, hashtags, platforms, status, tone, topic, source, scheduled_at, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.content.trim(),
      JSON.stringify(input.hashtags ?? []),
      JSON.stringify(platforms),
      status,
      input.tone ?? null,
      input.topic ?? null,
      input.source ?? 'manual',
      scheduledAt,
      publishedAt,
      now,
      now
    );

  const id = Number(result.lastInsertRowid);
  if (status === 'scheduled') {
    addActivity('schedule', `Scheduled a post for ${formatDate(scheduledAt)} on ${platforms.join(', ')}.`, id);
  } else if (status === 'published') {
    addActivity('publish', `Published a post immediately to ${platforms.join(', ')}.`, id);
  } else {
    addActivity('draft', `Saved a new draft for ${platforms.join(', ')}.`, id);
  }
  return getPost(id)!;
}

export function updatePost(
  id: number,
  input: Partial<Pick<Post, 'content' | 'hashtags' | 'platforms' | 'status' | 'scheduledAt' | 'tone'>>
): Post {
  const current = getPost(id);
  if (!current) throw new Error('Post not found');

  const content = input.content ?? current.content;
  const hashtags = input.hashtags ?? current.hashtags;
  const platforms = input.platforms ?? current.platforms;
  const status = input.status ?? current.status;
  const scheduledAt = input.scheduledAt ?? current.scheduledAt;
  const tone = input.tone ?? current.tone;

  if (!content.trim()) throw new Error('Content is required');
  if (platforms.length === 0) throw new Error('Choose at least one platform');
  if (status === 'scheduled' && !scheduledAt) throw new Error('Scheduled posts need a date and time');

  getDb()
    .prepare(
      `UPDATE posts SET content = ?, hashtags = ?, platforms = ?, status = ?, scheduled_at = ?,
       tone = ?, updated_at = ? WHERE id = ?`
    )
    .run(
      content.trim(),
      JSON.stringify(hashtags),
      JSON.stringify(platforms),
      status,
      status === 'scheduled' ? scheduledAt : null,
      tone,
      new Date().toISOString(),
      id
    );
  addActivity('edit', `Updated post #${id}.`, id);
  return getPost(id)!;
}

export function deletePost(id: number): boolean {
  const post = getPost(id);
  if (!post) return false;
  getDb().prepare('DELETE FROM posts WHERE id = ?').run(id);
  addActivity('delete', `Deleted post #${id}.`, null);
  return true;
}

export function markPostPublished(
  id: number,
  data: {
    publishedAt: string;
    externalUrl?: string | null;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  }
): void {
  getDb()
    .prepare(
      `UPDATE posts SET status = 'published', published_at = ?, external_url = ?, error = NULL,
       likes = likes + ?, comments = comments + ?, shares = shares + ?, impressions = impressions + ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      data.publishedAt,
      data.externalUrl ?? null,
      data.likes,
      data.comments,
      data.shares,
      data.impressions,
      data.publishedAt,
      id
    );
}

export function markPostFailed(id: number, error: string): void {
  getDb()
    .prepare(`UPDATE posts SET status = 'failed', error = ?, updated_at = ? WHERE id = ?`)
    .run(error, new Date().toISOString(), id);
}

export function dueScheduledPosts(now = new Date().toISOString()): Post[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM posts WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ?
       ORDER BY scheduled_at ASC LIMIT 25`
    )
    .all(now) as Record<string, unknown>[];
  return rows.map(toPost);
}

export function recordAnalytics(
  platform: Platform,
  metrics: { impressions: number; likes: number; comments: number; shares: number; clicks: number }
): void {
  const date = new Date().toISOString().slice(0, 10);
  getDb()
    .prepare(
      `INSERT INTO analytics_daily (date, platform, impressions, likes, comments, shares, clicks)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(date, platform) DO UPDATE SET
         impressions = impressions + excluded.impressions,
         likes = likes + excluded.likes,
         comments = comments + excluded.comments,
         shares = shares + excluded.shares,
         clicks = clicks + excluded.clicks`
    )
    .run(date, platform, metrics.impressions, metrics.likes, metrics.comments, metrics.shares, metrics.clicks);
}

export function addActivity(type: string, message: string, postId: number | null = null): void {
  getDb()
    .prepare('INSERT INTO activity (type, message, post_id, created_at) VALUES (?, ?, ?, ?)')
    .run(type, message, postId, new Date().toISOString());
}

export function listActivity(limit = 12): ActivityItem[] {
  const rows = getDb()
    .prepare('SELECT * FROM activity ORDER BY created_at DESC LIMIT ?')
    .all(limit) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: Number(row.id),
    type: String(row.type),
    message: String(row.message),
    postId: (row.post_id as number | null) ?? null,
    createdAt: String(row.created_at),
  }));
}

export function getAnalytics(days = 30): AnalyticsPoint[] {
  const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const rows = getDb()
    .prepare(
      `SELECT date, SUM(impressions) AS impressions, SUM(likes) AS likes, SUM(comments) AS comments,
       SUM(shares) AS shares, SUM(clicks) AS clicks
       FROM analytics_daily WHERE date >= ? GROUP BY date ORDER BY date ASC`
    )
    .all(since) as Array<Record<string, number | string>>;
  return rows.map((row) => ({
    date: String(row.date),
    impressions: Number(row.impressions),
    likes: Number(row.likes),
    comments: Number(row.comments),
    shares: Number(row.shares),
    clicks: Number(row.clicks),
  }));
}

export function getPlatformBreakdown(days = 30): PlatformAnalytics[] {
  const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const rows = getDb()
    .prepare(
      `SELECT platform, SUM(impressions) AS impressions, SUM(likes) AS likes, SUM(comments) AS comments,
       SUM(shares) AS shares, SUM(clicks) AS clicks
       FROM analytics_daily WHERE date >= ? GROUP BY platform`
    )
    .all(since) as Array<Record<string, number | string>>;

  return rows.map((row) => {
    const impressions = Number(row.impressions);
    const likes = Number(row.likes);
    const comments = Number(row.comments);
    const shares = Number(row.shares);
    const engagements = likes + comments + shares;
    const platform = row.platform as Platform;
    const count = getDb()
      .prepare(`SELECT COUNT(*) AS count FROM posts WHERE platforms LIKE ?`)
      .get(`%"${platform}"%`) as { count: number };
    return {
      platform,
      impressions,
      likes,
      comments,
      shares,
      clicks: Number(row.clicks),
      posts: Number(count.count),
      engagementRate: impressions ? Number(((engagements / impressions) * 100).toFixed(2)) : 0,
    };
  });
}

export function getTotals(): {
  posts: number;
  published: number;
  scheduled: number;
  drafts: number;
  failed: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagementRate: number;
} {
  const statusRows = getDb()
    .prepare('SELECT status, COUNT(*) AS count FROM posts GROUP BY status')
    .all() as Array<{ status: PostStatus; count: number }>;
  const counts = { draft: 0, scheduled: 0, published: 0, failed: 0 };
  for (const row of statusRows) counts[row.status] = Number(row.count);

  const metrics = getDb()
    .prepare(
      `SELECT COALESCE(SUM(likes),0) AS likes, COALESCE(SUM(comments),0) AS comments,
       COALESCE(SUM(shares),0) AS shares, COALESCE(SUM(impressions),0) AS impressions FROM posts`
    )
    .get() as { likes: number; comments: number; shares: number; impressions: number };
  const impressions = Number(metrics.impressions);
  const engagements = Number(metrics.likes) + Number(metrics.comments) + Number(metrics.shares);

  return {
    posts: counts.draft + counts.scheduled + counts.published + counts.failed,
    published: counts.published,
    scheduled: counts.scheduled,
    drafts: counts.draft,
    failed: counts.failed,
    likes: Number(metrics.likes),
    comments: Number(metrics.comments),
    shares: Number(metrics.shares),
    impressions,
    engagementRate: impressions ? Number(((engagements / impressions) * 100).toFixed(2)) : 0,
  };
}

export function getUpcoming(limit = 5): Post[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM posts WHERE status = 'scheduled' AND scheduled_at IS NOT NULL
       ORDER BY scheduled_at ASC LIMIT ?`
    )
    .all(limit) as Record<string, unknown>[];
  return rows.map(toPost);
}

export function getRecentPosts(limit = 6): Post[] {
  const rows = getDb()
    .prepare(`SELECT * FROM posts ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?`)
    .all(limit) as Record<string, unknown>[];
  return rows.map(toPost);
}

export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  if (value === '') {
    getDb().prepare('DELETE FROM settings WHERE key = ?').run(key);
    return;
  }
  getDb()
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value);
}

export function isAutopilotEnabled(): boolean {
  return getSetting('autopilot') !== 'false';
}

export function isLinkedInAutoPostEnabled(): boolean {
  return getSetting('linkedin_auto_post') !== 'false';
}

export function createOAuthState(state: string): void {
  const db = getDb();
  db.prepare('DELETE FROM oauth_states WHERE created_at < ?').run(
    new Date(Date.now() - 10 * 60 * 1000).toISOString()
  );
  db.prepare('INSERT INTO oauth_states (state, created_at) VALUES (?, ?)').run(state, new Date().toISOString());
}

export function consumeOAuthState(state: string): boolean {
  const db = getDb();
  const row = db.prepare('SELECT state FROM oauth_states WHERE state = ?').get(state) as
    | { state: string }
    | undefined;
  if (!row) return false;
  db.prepare('DELETE FROM oauth_states WHERE state = ?').run(state);
  return true;
}

export function logPublish(input: {
  postId: number;
  platform: Platform;
  mode: string;
  ok: boolean;
  detail?: string | null;
}): void {
  getDb()
    .prepare('INSERT INTO publish_log (post_id, platform, mode, ok, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(
      input.postId,
      input.platform,
      input.mode,
      input.ok ? 1 : 0,
      input.detail ?? null,
      new Date().toISOString()
    );
}

export function getPublishLog(limit = 20): Array<{
  id: number;
  postId: number;
  platform: Platform;
  mode: string;
  ok: boolean;
  detail: string | null;
  createdAt: string;
}> {
  const rows = getDb()
    .prepare('SELECT * FROM publish_log ORDER BY id DESC LIMIT ?')
    .all(limit) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: Number(row.id),
    postId: Number(row.post_id),
    platform: row.platform as Platform,
    mode: String(row.mode),
    ok: Boolean(row.ok),
    detail: (row.detail as string | null) ?? null,
    createdAt: String(row.created_at),
  }));
}

export function formatDate(value: string | null): string {
  if (!value) return 'unscheduled';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

