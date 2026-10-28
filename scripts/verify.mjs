const base = (process.env.VERIFY_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

let pass = 0;
let fail = 0;
const failures = [];

function check(condition, message) {
  if (condition) {
    pass += 1;
    console.log(`  PASS  ${message}`);
  } else {
    fail += 1;
    failures.push(message);
    console.log(`  FAIL  ${message}`);
  }
}

async function request(pathname, options = {}) {
  const response = await fetch(`${base}${pathname}`, {
    method: options.method ?? 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    redirect: options.redirect ?? 'follow',
    signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  let data = text;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: response.status, data, headers: response.headers, text };
}

async function test(name, fn) {
  console.log(`\n${name}`);
  try {
    await fn();
  } catch (error) {
    fail += 1;
    failures.push(`${name}: ${error.message}`);
    console.log(`  FAIL  threw ${error.message}`);
  }
}

async function main() {
  console.log(`Verifying ${base}\n`);

  await test('Health and database', async () => {
    const result = await request('/api/health');
    check(result.status === 200, 'GET /api/health returns 200');
    check(result.data?.ok === true, 'health reports ok');
    check(result.data?.database === 'sqlite', 'database is SQLite');
    check(typeof result.data?.totals?.posts === 'number', 'post totals are present');
  });

  await test('Seed reset', async () => {
    const result = await request('/api/seed/reset', { method: 'POST' });
    check(result.status === 200, 'POST /api/seed/reset returns 200');
    const dashboard = await request('/api/dashboard');
    check(dashboard.data?.totals?.posts >= 20, 'seeded dashboard has demo posts');
  });

  await test('Dashboard data', async () => {
    const result = await request('/api/dashboard');
    check(result.status === 200, 'GET /api/dashboard returns 200');
    check(Array.isArray(result.data?.accounts) && result.data.accounts.length === 6, 'six platform accounts are seeded');
    check(Array.isArray(result.data?.analytics) && result.data.analytics.length > 0, 'analytics series is populated');
    check(Array.isArray(result.data?.activity) && result.data.activity.length > 0, 'activity feed is populated');
    check(result.data?.scheduler?.autopilot === true, 'autopilot is enabled by default');
  });

  await test('Posts list and filters', async () => {
    const all = await request('/api/posts');
    check(all.status === 200, 'GET /api/posts returns 200');
    check(Array.isArray(all.data?.posts), 'posts array is returned');
    const filtered = await request('/api/posts?status=published&platform=linkedin');
    check(filtered.data?.posts?.every((post) => post.status === 'published'), 'status filter works');
    check(
      filtered.data?.posts?.every((post) => post.platforms.includes('linkedin')),
      'platform filter works'
    );
    const search = await request('/api/posts?q=founders');
    check(Array.isArray(search.data?.posts), 'search query works');
  });

  await test('Groq status and generation', async () => {
    const status = await request('/api/ai/status');
    check(status.status === 200, 'GET /api/ai/status returns 200');
    check(['live', 'mock'].includes(status.data?.mode), 'AI mode is reported');
    const generated = await request('/api/ai/generate', {
      method: 'POST',
      body: {
        topic: 'Verification run: founder-led content systems',
        platforms: ['linkedin', 'x'],
        tone: 'professional',
        count: 2,
        keywords: ['verification', 'content'],
        save: 'none',
      },
    });
    check(generated.status === 200, 'POST /api/ai/generate returns 200');
    check(generated.data?.posts?.length === 2, 'generates the requested number of posts');
    check(generated.data?.mode === 'mock' || generated.data?.mode === 'live', 'generation reports its mode');
    if (status.data?.mode === 'live') {
      check(
        generated.data?.mode === 'live' || Boolean(generated.data?.warning),
        'live mode succeeds or falls back with a warning'
      );
    }
  });

  await test('Settings: local Groq key save and clear', async () => {
    const status = await request('/api/ai/status');
    const envKey = status.data?.keySource === 'environment';
    const saved = await request('/api/settings', {
      method: 'PATCH',
      body: { groqApiKey: 'gsk_verification_dummy_key_123' },
    });
    check(saved.status === 200, 'PATCH /api/settings saves a key');
    check(
      saved.data?.ai?.keySource === (envKey ? 'environment' : 'local'),
      envKey ? 'environment key keeps priority' : 'saved key is read from local storage'
    );
    check(Boolean(saved.data?.ai?.keyMasked), 'key is masked in the response');
    const cleared = await request('/api/settings', { method: 'PATCH', body: { groqApiKey: '' } });
    check(
      envKey ? cleared.data?.ai?.keySource === 'environment' : cleared.data?.ai?.keySource !== 'local',
      envKey ? 'clearing the local key keeps the environment key' : 'clearing the key removes local storage'
    );
  });

  await test('Bulk save generated posts', async () => {
    const generated = await request('/api/ai/generate', {
      method: 'POST',
      body: {
        topic: 'Verification batch',
        platforms: ['linkedin', 'x'],
        count: 2,
        save: 'none',
      },
    });
    const posts = generated.data.posts.map((post) => ({
      content: post.content,
      hashtags: post.hashtags,
      platforms: [post.platform],
      tone: post.tone,
    }));
    const saved = await request('/api/posts/bulk', {
      method: 'POST',
      body: { posts, status: 'draft', topic: 'Verification batch', source: 'ai' },
    });
    check(saved.status === 201, 'POST /api/posts/bulk returns 201');
    check(saved.data?.saved?.length === 2, 'bulk save stores every post');
    globalThis.__verifyDrafts = saved.data.saved;
  });

  await test('Edit a post', async () => {
    const draft = globalThis.__verifyDrafts[0];
    const updated = await request(`/api/posts/${draft.id}`, {
      method: 'PATCH',
      body: {
        content: `${draft.content}\n\nEdited by the verification run.`,
        platforms: ['linkedin'],
        status: 'draft',
      },
    });
    check(updated.status === 200, 'PATCH /api/posts/:id returns 200');
    check(updated.data?.post?.content?.includes('Edited by the verification run'), 'edited content is stored');
    check(updated.data?.post?.platforms?.length === 1, 'platforms can be changed');
  });

  await test('Publish a post (demo LinkedIn path)', async () => {
    const draft = globalThis.__verifyDrafts[0];
    const published = await request(`/api/posts/${draft.id}/publish`, { method: 'POST' });
    check(published.status === 200, 'POST /api/posts/:id/publish returns 200');
    check(published.data?.ok === true, 'publish reports success');
    check(published.data?.post?.status === 'published', 'post status becomes published');
    check(
      published.data?.results?.some((result) => result.platform === 'linkedin'),
      'LinkedIn publish path ran'
    );
    const fetched = await request(`/api/posts/${draft.id}`);
    check(fetched.data?.post?.impressions > 0, 'publishing records impressions');
  });

  await test('Schedule and autopilot publish', async () => {
    const scheduled = await request('/api/posts', {
      method: 'POST',
      body: {
        content: 'Autopilot verification post. This should be published by the scheduler.',
        platforms: ['linkedin'],
        status: 'scheduled',
        scheduledAt: new Date(Date.now() - 60_000).toISOString(),
        tone: 'professional',
      },
    });
    check(scheduled.status === 201, 'POST /api/posts creates a scheduled post');
    check(scheduled.data?.post?.status === 'scheduled', 'post starts as scheduled');
    const run = await request('/api/scheduler/run', { method: 'POST' });
    check(run.status === 200, 'POST /api/scheduler/run returns 200');
    check(run.data?.published >= 1, 'scheduler publishes at least one due post');
    const fetched = await request(`/api/posts/${scheduled.data.post.id}`);
    check(fetched.data?.post?.status === 'published', 'due post becomes published');
  });

  await test('Analytics', async () => {
    const result = await request('/api/analytics?days=30');
    check(result.status === 200, 'GET /api/analytics returns 200');
    check(result.data?.points?.length > 0, 'daily points are returned');
    check(result.data?.platforms?.length === 6, 'six platform rows are returned');
    check(typeof result.data?.totals?.engagementRate === 'number', 'engagement rate is computed');
  });

  await test('Brand profile update', async () => {
    const current = await request('/api/profile');
    check(current.status === 200, 'GET /api/profile returns 200');
    const profile = current.data.profile;
    const updated = await request('/api/profile', {
      method: 'PATCH',
      body: {
        name: profile.name,
        role: profile.role,
        brandVoice: profile.brandVoice,
        followers: profile.followers,
      },
    });
    check(updated.status === 200, 'PATCH /api/profile returns 200');
    check(updated.data?.profile?.name === profile.name, 'profile update is persisted');
  });

  await test('Account connect and disconnect', async () => {
    const disconnected = await request('/api/accounts/linkedin/disconnect', { method: 'POST' });
    check(disconnected.status === 200, 'POST disconnect returns 200');
    const afterDisconnect = await request('/api/accounts');
    const linkedin = afterDisconnect.data.accounts.find((account) => account.platform === 'linkedin');
    check(linkedin?.status === 'disconnected', 'LinkedIn is disconnected');
    const connected = await request('/api/accounts/linkedin/connect-demo', { method: 'POST' });
    check(connected.status === 200, 'POST connect-demo returns 200');
    const afterConnect = await request('/api/accounts');
    const linkedinAgain = afterConnect.data.accounts.find((account) => account.platform === 'linkedin');
    check(linkedinAgain?.status === 'connected', 'LinkedIn reconnects in demo mode');
  });

  await test('LinkedIn OAuth redirect when unconfigured', async () => {
    const result = await request('/api/auth/linkedin', { redirect: 'manual' });
    check(result.status >= 300 && result.status < 400, 'auth endpoint returns a redirect');
    const location = result.headers.get('location') || '';
    check(location.includes('linkedin=unconfigured'), 'redirect explains missing credentials');
  });

  await test('Publish log', async () => {
    const result = await request('/api/publish-log');
    check(result.status === 200, 'GET /api/publish-log returns 200');
    check(Array.isArray(result.data?.entries) && result.data.entries.length > 0, 'publish attempts are logged');
  });

  await test('Delete a post', async () => {
    const draft = globalThis.__verifyDrafts[1];
    const deleted = await request(`/api/posts/${draft.id}`, { method: 'DELETE' });
    check(deleted.status === 200, 'DELETE /api/posts/:id returns 200');
    const fetched = await request(`/api/posts/${draft.id}`);
    check(fetched.status === 404, 'deleted post is gone');
  });

  await test('Pages render', async () => {
    for (const pathname of ['/', '/posts', '/create', '/calendar', '/analytics', '/settings']) {
      const page = await request(pathname);
      check(page.status === 200, `GET ${pathname} returns 200`);
      check(typeof page.text === 'string' && page.text.includes('Pulse'), `${pathname} renders the app shell`);
    }
  });

  await test('Final reset leaves clean demo data', async () => {
    const reset = await request('/api/seed/reset', { method: 'POST' });
    check(reset.status === 200, 'final reset returns 200');
    const dashboard = await request('/api/dashboard');
    check(dashboard.data?.totals?.drafts === 4, 'seeded drafts are restored');
  });

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) {
    console.log('\nFailures:');
    for (const failure of failures) console.log(`- ${failure}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
