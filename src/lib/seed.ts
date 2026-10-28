import type Database from 'better-sqlite3';
import type { Platform, PostStatus, Tone } from './types';

const DAY = 24 * 60 * 60 * 1000;

function iso(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

function seeded(seed: number): () => number {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

interface SeedPost {
  content: string;
  hashtags: string[];
  platforms: Platform[];
  status: PostStatus;
  tone: Tone;
  topic: string;
  offset: number;
  metrics?: [number, number, number, number];
}

const seedPosts: SeedPost[] = [
  {
    content:
      'Most founders do not have a content problem. They have a consistency problem.\n\nThe teams winning right now ship one useful idea every single day. Not perfect. Not viral. Just consistent.',
    hashtags: ['contentstrategy', 'founders', 'buildinpublic'],
    platforms: ['linkedin', 'x'],
    status: 'published',
    tone: 'professional',
    topic: 'Content consistency for founders',
    offset: -1.2 * DAY,
    metrics: [18420, 612, 84, 41],
  },
  {
    content:
      'We replaced 6 hours of weekly reporting with a single automated workflow.\n\nSame insight. Zero spreadsheets. The team now spends that time talking to customers instead.',
    hashtags: ['automation', 'operations', 'aiautomation'],
    platforms: ['linkedin'],
    status: 'published',
    tone: 'bold',
    topic: 'Automating weekly reporting',
    offset: -2.1 * DAY,
    metrics: [12860, 438, 51, 33],
  },
  {
    content:
      'Unpopular opinion: your posting schedule matters more than your posting genius.\n\nA decent idea published on time beats a brilliant idea stuck in drafts.',
    hashtags: ['socialmedia', 'marketingtips'],
    platforms: ['x', 'linkedin'],
    status: 'published',
    tone: 'bold',
    topic: 'Consistency over perfection',
    offset: -3.3 * DAY,
    metrics: [21240, 921, 118, 76],
  },
  {
    content:
      'Behind the scenes of our AI content pipeline:\n\n1. Trend scan\n2. Idea scoring\n3. Draft generation\n4. Human edit\n5. Schedule and measure\n\nThe human step is not optional. It is the moat.',
    hashtags: ['aicontent', 'contentops', 'workflow'],
    platforms: ['linkedin', 'instagram'],
    status: 'published',
    tone: 'professional',
    topic: 'AI content pipeline',
    offset: -4.4 * DAY,
    metrics: [15780, 553, 66, 48],
  },
  {
    content:
      '3 signs your social media is working even when likes feel flat:\n\n- Inbound DMs mention a specific post\n- Sales calls quote your content\n- Candidates say they found you online\n\nAttention is vanity. Recall is revenue.',
    hashtags: ['marketing', 'growth', 'b2b'],
    platforms: ['linkedin'],
    status: 'published',
    tone: 'professional',
    topic: 'Measuring social media impact',
    offset: -5.6 * DAY,
    metrics: [9860, 341, 44, 29],
  },
  {
    content:
      'We audited 40 founder profiles last month.\n\n38 of them described what they sell.\n2 described the problem they obsess over.\n\nThe 2 got 4x the inbound.',
    hashtags: ['positioning', 'personalbrand'],
    platforms: ['x', 'linkedin'],
    status: 'published',
    tone: 'bold',
    topic: 'Positioning around a problem',
    offset: -6.7 * DAY,
    metrics: [24310, 1102, 143, 88],
  },
  {
    content:
      'A small ritual that changed our content quality:\n\nBefore publishing, ask "would I send this to a smart friend?"\n\nIf the answer is no, it is not ready.',
    hashtags: ['writing', 'contentquality'],
    platforms: ['instagram', 'x'],
    status: 'published',
    tone: 'casual',
    topic: 'Content quality checklist',
    offset: -7.8 * DAY,
    metrics: [13940, 786, 92, 51],
  },
  {
    content:
      'Your calendar is a strategy document.\n\nIf social media is not on it, it is not a priority. It is a hope.',
    hashtags: ['productivity', 'socialmedia'],
    platforms: ['linkedin'],
    status: 'published',
    tone: 'bold',
    topic: 'Prioritising social media',
    offset: -9.2 * DAY,
    metrics: [11220, 402, 37, 25],
  },
  {
    content:
      'Case study: a B2B founder went from 2 posts a month to 5 a week.\n\nResult after 60 days:\n- 3.1x profile views\n- 19 qualified DMs\n- 2 closed deals\n\nNothing went viral. It just compounded.',
    hashtags: ['casestudy', 'b2bmarketing', 'growth'],
    platforms: ['linkedin', 'facebook'],
    status: 'published',
    tone: 'professional',
    topic: 'Consistent posting case study',
    offset: -10.5 * DAY,
    metrics: [19870, 834, 121, 64],
  },
  {
    content:
      'The best content systems are boring.\n\nSame pillars. Same cadence. Same review loop.\n\nBoring systems create interesting results.',
    hashtags: ['contentstrategy', 'systems'],
    platforms: ['x'],
    status: 'published',
    tone: 'inspirational',
    topic: 'Boring content systems',
    offset: -12.1 * DAY,
    metrics: [8760, 511, 39, 22],
  },
  {
    content:
      'We are opening 3 spots for a free 20-minute content audit this week.\n\nWe will review your last 10 posts and show you exactly what to fix. Comment "AUDIT" and I will send the details.',
    hashtags: ['contentaudit', 'freeprotocol'],
    platforms: ['linkedin', 'instagram', 'facebook'],
    status: 'published',
    tone: 'casual',
    topic: 'Free content audit offer',
    offset: -14.3 * DAY,
    metrics: [16450, 690, 97, 44],
  },
  {
    content:
      'Reminder: you do not need a new tool.\n\nYou need a decision about who you are talking to and what you want them to do next.',
    hashtags: ['marketing', 'clarity'],
    platforms: ['linkedin', 'x'],
    status: 'published',
    tone: 'bold',
    topic: 'Clarity over tools',
    offset: -16.2 * DAY,
    metrics: [13480, 623, 58, 31],
  },
  {
    content:
      'If your content could be posted by anyone in your category, it is not positioning. It is noise.',
    hashtags: ['positioning', 'brand'],
    platforms: ['linkedin'],
    status: 'published',
    tone: 'bold',
    topic: 'Distinctive positioning',
    offset: -18.4 * DAY,
    metrics: [10940, 377, 29, 18],
  },
  {
    content:
      'A 15-minute weekly review beats a 3-hour monthly panic.\n\nWhat worked? What flopped? What should we double down on?\n\nThat is the whole meeting.',
    hashtags: ['contentops', 'review'],
    platforms: ['x', 'instagram'],
    status: 'published',
    tone: 'casual',
    topic: 'Weekly content review',
    offset: -20.1 * DAY,
    metrics: [7420, 388, 34, 19],
  },
  {
    content:
      'Tomorrow at 9am: a LinkedIn post about the one metric most founders ignore.\n\nWant the draft before it goes live? Reply "EARLY" and I will send it over.',
    hashtags: ['linkedin', 'teaser'],
    platforms: ['linkedin', 'x'],
    status: 'scheduled',
    tone: 'casual',
    topic: 'Teaser for metric post',
    offset: 0.45 * DAY,
  },
  {
    content:
      'The metric most founders ignore: save rate.\n\nLikes tell you someone was polite. Saves tell you someone plans to come back.\n\nTrack saves weekly. It predicts revenue better than reach.',
    hashtags: ['metrics', 'socialmediamarketing'],
    platforms: ['linkedin', 'x'],
    status: 'scheduled',
    tone: 'professional',
    topic: 'Save rate as a leading metric',
    offset: 0.85 * DAY,
  },
  {
    content:
      'Swipe for the exact 5-slide framework we use to turn one customer call into a week of content.\n\nSlide 1: the objection\nSlide 2: the reframe\nSlide 3: the proof\nSlide 4: the action\nSlide 5: the recap',
    hashtags: ['carousel', 'contentrepurposing'],
    platforms: ['instagram', 'linkedin'],
    status: 'scheduled',
    tone: 'professional',
    topic: 'Customer call to content framework',
    offset: 1.7 * DAY,
  },
  {
    content:
      'We are testing a new format this week: 60-second screen recordings instead of static screenshots.\n\nPrediction: higher watch time, lower reach. Let us see what the data says.',
    hashtags: ['experiment', 'shortvideo'],
    platforms: ['tiktok', 'instagram', 'youtube'],
    status: 'scheduled',
    tone: 'casual',
    topic: 'Testing screen recording format',
    offset: 2.6 * DAY,
  },
  {
    content:
      'A founder asked me: "How do I sound less like AI?"\n\nUse fewer adjectives. Name one specific detail. Cut the summary sentence.\n\nSpecific beats polished every time.',
    hashtags: ['writingtips', 'aicontent'],
    platforms: ['x', 'linkedin'],
    status: 'scheduled',
    tone: 'professional',
    topic: 'Sounding human in AI content',
    offset: 3.9 * DAY,
  },
  {
    content:
      'Monthly recap thread:\n\n5 posts published\n2 inbound leads from LinkedIn\n1 process rebuilt\n0 viral moments\n\nThis is what compounding looks like.',
    hashtags: ['buildinpublic', 'monthlyrecap'],
    platforms: ['x', 'linkedin'],
    status: 'scheduled',
    tone: 'casual',
    topic: 'Monthly recap',
    offset: 5.4 * DAY,
  },
  {
    content:
      'Draft: 7 hooks I want to test next month.\n\nNeed to pick the strongest three before Monday.',
    hashtags: ['hooks', 'testing'],
    platforms: ['linkedin'],
    status: 'draft',
    tone: 'casual',
    topic: 'Hook testing ideas',
    offset: 0,
  },
  {
    content:
      'Draft: what we learned running 30 days of AI-assisted posts.\n\n- The first draft is never the post\n- Human examples carry the weight\n- Scheduling is the real unlock',
    hashtags: ['aicontent', 'lessons'],
    platforms: ['linkedin', 'instagram'],
    status: 'draft',
    tone: 'professional',
    topic: '30 days of AI-assisted posts',
    offset: 0,
  },
  {
    content:
      'Draft: a simple template for turning a webinar into 8 posts.\n\nWebinars are underused content libraries.',
    hashtags: ['repurposing', 'webinar'],
    platforms: ['x', 'youtube'],
    status: 'draft',
    tone: 'professional',
    topic: 'Webinar repurposing template',
    offset: 0,
  },
  {
    content:
      'Draft: poll idea - what is your biggest content bottleneck?\n\nA) Ideas\nB) Time\nC) Editing\nD) Distribution',
    hashtags: ['poll', 'research'],
    platforms: ['linkedin', 'x'],
    status: 'draft',
    tone: 'casual',
    topic: 'Content bottleneck poll',
    offset: 0,
  },
  {
    content:
      'Post failed to publish to Instagram: image asset was missing. Retry queued for tomorrow morning.',
    hashtags: [],
    platforms: ['instagram'],
    status: 'failed',
    tone: 'professional',
    topic: 'Instagram publish retry',
    offset: -1.8 * DAY,
  },
  {
    content:
      'Scheduled LinkedIn post failed: token expired. Reconnect LinkedIn from Settings to resume auto-posting.',
    hashtags: [],
    platforms: ['linkedin'],
    status: 'failed',
    tone: 'professional',
    topic: 'LinkedIn token expiry',
    offset: -0.9 * DAY,
  },
];

export function seedDatabase(db: Database.Database): void {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM profile').get() as { count: number };
  if (existing.count > 0) return;

  const now = new Date().toISOString();
  const random = seeded(7321);

  const insertProfile = db.prepare(
    `INSERT INTO profile (id, name, email, company, role, niche, website, tone, brand_voice, signature, followers, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertProfile.run(
    'Uday Sharma',
    'uday@diyaa.ai',
    'Diyaa AI',
    'Founder & AI Automation Specialist',
    'AI automation and growth systems for B2B founders',
    'https://diyaa.ai',
    'professional',
    'Direct, practical, a little contrarian. We share real numbers and lessons, never hype. Short sentences. Specific examples. No em-dashes.',
    'Built by Uday at Diyaa AI',
    12840,
    now
  );

  const accounts: Array<[Platform, string, string]> = [
    ['linkedin', '@uday-builds', 'Uday Sharma'],
    ['x', '@uday_ai', 'Uday'],
    ['instagram', '@uday.ai', 'Uday AI'],
    ['facebook', 'Uday AI', 'Uday AI'],
    ['tiktok', '@uday.ai', 'Uday AI'],
    ['youtube', '@UdayAI', 'Uday AI'],
  ];
  const insertAccount = db.prepare(
    `INSERT INTO accounts (platform, handle, display_name, status, mode, meta, connected_at, updated_at)
     VALUES (?, ?, ?, 'connected', 'demo', ?, ?, ?)`
  );
  for (const [platform, handle, displayName] of accounts) {
    insertAccount.run(
      platform,
      handle,
      displayName,
      JSON.stringify({ profileUrl: `https://example.com/${platform}/${handle.replace('@', '')}` }),
      iso(-30 * DAY),
      now
    );
  }

  const insertPost = db.prepare(
    `INSERT INTO posts (content, hashtags, platforms, status, tone, topic, source, scheduled_at, published_at, error, likes, comments, shares, impressions, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'seed', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const post of seedPosts) {
    const created = iso(post.offset - 0.2 * DAY);
    const scheduledAt = post.status === 'scheduled' ? iso(post.offset) : null;
    const publishedAt = post.status === 'published' ? iso(post.offset) : null;
    const metrics = post.metrics ?? [0, 0, 0, 0];
    insertPost.run(
      post.content,
      JSON.stringify(post.hashtags),
      JSON.stringify(post.platforms),
      post.status,
      post.tone,
      post.topic,
      scheduledAt,
      publishedAt,
      post.status === 'failed' ? post.content : null,
      metrics[1],
      metrics[2],
      metrics[3],
      metrics[0],
      created,
      publishedAt ?? created
    );
  }

  const insertAnalytics = db.prepare(
    `INSERT INTO analytics_daily (date, platform, impressions, likes, comments, shares, clicks)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const reach: Record<Platform, number> = {
    linkedin: 2400,
    x: 1900,
    instagram: 2100,
    facebook: 900,
    tiktok: 1500,
    youtube: 800,
  };

  for (let day = 29; day >= 0; day -= 1) {
    const date = new Date(Date.now() - day * DAY);
    const key = date.toISOString().slice(0, 10);
    const weekday = date.getDay();
    const weekdayFactor = weekday === 0 || weekday === 6 ? 0.62 : 1;
    const growth = 1 + (29 - day) * 0.018;

    for (const platform of Object.keys(reach) as Platform[]) {
      const noise = 0.78 + random() * 0.5;
      const impressions = Math.round(reach[platform] * weekdayFactor * growth * noise);
      const likeRate = 0.028 + random() * 0.018;
      const likes = Math.round(impressions * likeRate);
      const comments = Math.round(likes * (0.07 + random() * 0.06));
      const shares = Math.round(likes * (0.05 + random() * 0.05));
      const clicks = Math.round(impressions * (0.006 + random() * 0.006));
      insertAnalytics.run(key, platform, impressions, likes, comments, shares, clicks);
    }
  }

  const insertActivity = db.prepare(
    `INSERT INTO activity (type, message, post_id, created_at) VALUES (?, ?, ?, ?)`
  );
  const activity: Array<[string, string, number | null, number]> = [
    ['publish', 'Published "Most founders do not have a content problem" to LinkedIn and X', 1, -1.2],
    ['generate', 'Generated 5 drafts with Groq for the topic "AI content pipeline"', null, -1.6],
    ['connect', 'LinkedIn connected in demo mode. Real posting is available after OAuth setup.', null, -2.0],
    ['schedule', 'Scheduled "The metric most founders ignore" for tomorrow morning', 16, -2.4],
    ['publish', 'Published "We replaced 6 hours of weekly reporting" to LinkedIn', 2, -2.1],
    ['analytics', 'Weekly analytics synced for 6 platforms', null, -2.8],
    ['fail', 'LinkedIn post failed: token expired. Reconnect required.', 26, -0.9],
    ['generate', 'Generated 3 caption variants with the mock generator', null, -3.2],
    ['settings', 'Autopilot enabled. Due posts will publish automatically.', null, -3.6],
    ['publish', 'Published "3 signs your social media is working" to LinkedIn', 5, -5.6],
    ['schedule', 'Scheduled 4 posts for next week', null, -6.1],
    ['connect', 'Connected X, Instagram, Facebook, TikTok, and YouTube in demo mode', null, -30],
  ];
  for (const [type, message, postId, dayOffset] of activity) {
    insertActivity.run(type, message, postId, iso(dayOffset * DAY));
  }

  const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('autopilot', 'true');
  insertSetting.run('linkedin_auto_post', 'true');
  insertSetting.run('last_scheduler_run', '');
  insertSetting.run('last_scheduler_published', '0');
}
