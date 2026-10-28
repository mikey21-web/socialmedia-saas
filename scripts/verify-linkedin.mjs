import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const appPort = Number(process.env.VERIFY_LINKEDIN_PORT || 3100);
const mockPort = Number(process.env.VERIFY_MOCK_PORT || 4999);
const appUrl = `http://localhost:${appPort}`;
const mockUrl = `http://localhost:${mockPort}`;
const dataDir = 'data-verify';

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

const received = { token: null, userinfo: 0, posts: [] };

const mock = http.createServer((request, response) => {
  let body = '';
  request.on('data', (chunk) => {
    body += chunk;
  });
  request.on('end', () => {
    const url = new URL(request.url, mockUrl);
    if (url.pathname === '/oauth/v2/accessToken' && request.method === 'POST') {
      received.token = body;
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(
        JSON.stringify({
          access_token: 'mock-access-token',
          expires_in: 3600,
          scope: 'openid profile w_member_social',
        })
      );
      return;
    }
    if (url.pathname === '/v2/userinfo') {
      received.userinfo += 1;
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ sub: 'mock-member-123', name: 'Mock LinkedIn User' }));
      return;
    }
    if (url.pathname === '/rest/posts' && request.method === 'POST') {
      let parsed = {};
      try {
        parsed = JSON.parse(body || '{}');
      } catch {
        parsed = {};
      }
      received.posts.push({ body: parsed, headers: request.headers });
      response.writeHead(201, {
        'Content-Type': 'application/json',
        'x-restli-id': `urn:li:share:mock-${received.posts.length}`,
      });
      response.end('{}');
      return;
    }
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'not found', path: url.pathname }));
  });
});

async function waitFor(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (response.status < 500) return true;
    } catch {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return false;
}

async function request(pathname, options = {}) {
  const response = await fetch(`${appUrl}${pathname}`, {
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
  return { status: response.status, data, headers: response.headers };
}

async function main() {
  fs.rmSync(path.join(process.cwd(), dataDir), { recursive: true, force: true });
  await new Promise((resolve) => mock.listen(mockPort, resolve));
  console.log(`Mock LinkedIn listening on ${mockUrl}`);

  const env = {
    ...process.env,
    DATA_DIR: dataDir,
    NEXT_PUBLIC_APP_URL: appUrl,
    LINKEDIN_CLIENT_ID: 'test-client',
    LINKEDIN_CLIENT_SECRET: 'test-secret',
    LINKEDIN_REDIRECT_URI: `${appUrl}/api/auth/linkedin/callback`,
    LINKEDIN_OAUTH_BASE: mockUrl,
    LINKEDIN_API_BASE: mockUrl,
    LINKEDIN_VERSION: '202501',
    LINKEDIN_FORCE_DEMO: 'false',
    TOKEN_ENCRYPTION_SECRET: 'verification-secret',
    SCHEDULER_ENABLED: 'false',
    GROQ_API_KEY: '',
    GROQ_FORCE_MOCK: 'false',
  };

  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(process.execPath, [nextBin, 'start', '-p', String(appPort)], {
    cwd: process.cwd(),
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => process.stdout.write(`[app] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[app] ${chunk}`));

  try {
    const ready = await waitFor(`${appUrl}/api/health`);
    check(ready, `Next.js starts on port ${appPort}`);
    if (!ready) throw new Error('App did not become ready');

    console.log('\nOAuth connection');
    const auth = await request('/api/auth/linkedin', { redirect: 'manual' });
    check(auth.status >= 300 && auth.status < 400, 'GET /api/auth/linkedin redirects');
    const location = auth.headers.get('location') || '';
    const authorize = new URL(location);
    check(authorize.pathname === '/oauth/v2/authorization', 'redirect points at the OAuth authorize endpoint');
    check(authorize.searchParams.get('client_id') === 'test-client', 'client id is included');
    check(authorize.searchParams.get('scope')?.includes('w_member_social'), 'w_member_social scope is requested');
    check(
      authorize.searchParams.get('redirect_uri') === `${appUrl}/api/auth/linkedin/callback`,
      'redirect uri is included'
    );
    const state = authorize.searchParams.get('state');
    check(Boolean(state), 'state parameter is generated');

    const callback = await fetch(
      `${appUrl}/api/auth/linkedin/callback?code=test-code&state=${encodeURIComponent(state)}`,
      { redirect: 'manual' }
    );
    check(callback.status >= 300 && callback.status < 400, 'callback returns a redirect');
    check(
      (callback.headers.get('location') || '').includes('linkedin=connected'),
      'callback reports a successful connection'
    );
    check(received.token?.includes('grant_type=authorization_code'), 'token exchange used the authorization code grant');
    check(received.token?.includes('client_id=test-client'), 'token exchange included the client id');
    check(received.userinfo >= 1, 'userinfo was fetched from LinkedIn');

    const accounts = await request('/api/accounts');
    const linkedin = accounts.data.accounts.find((account) => account.platform === 'linkedin');
    check(linkedin?.mode === 'live', 'LinkedIn account is stored in live mode');
    check(linkedin?.hasToken === true, 'access token is stored encrypted');

    console.log('\nLive publish');
    const created = await request('/api/posts', {
      method: 'POST',
      body: {
        content: 'Live LinkedIn verification post.',
        hashtags: ['verification', 'automation'],
        platforms: ['linkedin'],
        status: 'draft',
        tone: 'professional',
      },
    });
    check(created.status === 201, 'create a LinkedIn draft');
    const published = await request(`/api/posts/${created.data.post.id}/publish`, { method: 'POST' });
    check(published.status === 200, 'publish returns 200');
    check(published.data?.ok === true, 'publish succeeds');
    check(published.data?.results?.[0]?.mode === 'live', 'publish used the live LinkedIn path');
    check(
      published.data?.results?.[0]?.externalUrl === 'https://www.linkedin.com/feed/update/urn:li:share:mock-1',
      'external URL is built from the LinkedIn post urn'
    );
    const sent = received.posts[0];
    check(sent?.body?.author === 'urn:li:person:mock-member-123', 'post author is the connected member');
    check(sent?.body?.commentary?.includes('Live LinkedIn verification post'), 'post commentary contains the content');
    check(sent?.body?.commentary?.includes('#verification'), 'hashtags are appended to the commentary');
    check(sent?.body?.visibility === 'PUBLIC', 'visibility is PUBLIC');
    check(sent?.headers?.authorization === 'Bearer mock-access-token', 'bearer token is sent');
    check(sent?.headers?.['linkedin-version'] === '202501', 'LinkedIn-Version header is sent');

    console.log('\nScheduled live auto-post');
    const scheduled = await request('/api/posts', {
      method: 'POST',
      body: {
        content: 'Scheduled live LinkedIn auto-post verification.',
        platforms: ['linkedin'],
        status: 'scheduled',
        scheduledAt: new Date(Date.now() - 60_000).toISOString(),
      },
    });
    check(scheduled.status === 201, 'create a scheduled LinkedIn post');
    const run = await request('/api/scheduler/run', { method: 'POST' });
    check(run.status === 200, 'scheduler run returns 200');
    check(run.data?.published >= 1, 'scheduler published the due post');
    check(received.posts.length >= 2, 'a second live LinkedIn request was sent');
    const fetched = await request(`/api/posts/${scheduled.data.post.id}`);
    check(fetched.data?.post?.status === 'published', 'scheduled post is now published');

    const log = await request('/api/publish-log?limit=10');
    check(
      log.data.entries.some((entry) => entry.platform === 'linkedin' && entry.mode === 'live' && entry.ok),
      'publish log records live LinkedIn successes'
    );

    console.log('\nDisconnect clears the live token');
    const disconnected = await request('/api/accounts/linkedin/disconnect', { method: 'POST' });
    check(disconnected.status === 200, 'disconnect returns 200');
    const after = await request('/api/accounts');
    const afterLinkedin = after.data.accounts.find((account) => account.platform === 'linkedin');
    check(afterLinkedin?.mode === 'demo', 'disconnected account falls back to demo mode');
    check(afterLinkedin?.hasToken === false, 'token is removed');
  } finally {
    child.kill();
    await new Promise((resolve) => mock.close(resolve));
    await new Promise((resolve) => setTimeout(resolve, 400));
    try {
      child.kill('SIGKILL');
    } catch {
      // already stopped
    }
    fs.rmSync(path.join(process.cwd(), dataDir), { recursive: true, force: true });
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) {
    console.log('\nFailures:');
    for (const failure of failures) console.log(`- ${failure}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  try {
    mock.close();
  } catch {
    // ignore
  }
  process.exitCode = 1;
});
