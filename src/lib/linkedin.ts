import type { AccountMeta, Platform } from './types';
import { getRawAccount } from './db';
import { decryptToken } from './crypto';

function oauthBase(): string {
  return (process.env.LINKEDIN_OAUTH_BASE || 'https://www.linkedin.com').replace(/\/$/, '');
}

function apiBase(): string {
  return (process.env.LINKEDIN_API_BASE || 'https://api.linkedin.com').replace(/\/$/, '');
}

export interface LinkedInConfig {
  configured: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  version: string;
  forceDemo: boolean;
}

export function getLinkedInConfig(): LinkedInConfig {
  const clientId = (process.env.LINKEDIN_CLIENT_ID || '').trim();
  const clientSecret = (process.env.LINKEDIN_CLIENT_SECRET || '').trim();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return {
    configured: Boolean(clientId && clientSecret),
    clientId,
    clientSecret,
    redirectUri: (process.env.LINKEDIN_REDIRECT_URI || `${appUrl}/api/auth/linkedin/callback`).trim(),
    version: process.env.LINKEDIN_VERSION || '202501',
    forceDemo: process.env.LINKEDIN_FORCE_DEMO === 'true',
  };
}

export function buildLinkedInAuthUrl(state: string): string {
  const config = getLinkedInConfig();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
    scope: (process.env.LINKEDIN_SCOPES || 'openid profile w_member_social').trim(),
  });
  return `${oauthBase()}/oauth/v2/authorization?${params.toString()}`;
}

export interface LinkedInToken {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
}

export async function exchangeLinkedInCode(code: string): Promise<LinkedInToken> {
  const config = getLinkedInConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });
  const response = await fetch(`${oauthBase()}/oauth/v2/accessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`LinkedIn token exchange failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return (await response.json()) as LinkedInToken;
}

export async function fetchLinkedInProfile(accessToken: string): Promise<{
  sub: string;
  name: string;
  picture?: string;
}> {
  const response = await fetch(`${apiBase()}/v2/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`LinkedIn profile fetch failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  const data = (await response.json()) as { sub: string; name?: string; picture?: string };
  if (!data.sub) throw new Error('LinkedIn did not return a member id');
  return { sub: data.sub, name: data.name || 'LinkedIn member', picture: data.picture };
}

export interface LinkedInPublishResult {
  urn: string;
  externalUrl: string;
}

export async function publishToLinkedIn(input: {
  accessToken: string;
  personUrn: string;
  content: string;
  hashtags?: string[];
}): Promise<LinkedInPublishResult> {
  const config = getLinkedInConfig();
  const tagLine = (input.hashtags ?? [])
    .filter(Boolean)
    .map((tag) => `#${tag.replace(/^#+/, '')}`)
    .join(' ');
  const commentary = tagLine ? `${input.content}\n\n${tagLine}` : input.content;
  if (commentary.length > 3000) {
    throw new Error('LinkedIn commentary is limited to 3000 characters. Shorten the post or remove hashtags.');
  }


  const response = await fetch(`${apiBase()}/rest/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': config.version,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: input.personUrn,
      commentary,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`LinkedIn publish failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const urn = response.headers.get('x-restli-id') || response.headers.get('X-RestLi-Id') || '';
  return {
    urn: urn || 'urn:li:share:unknown',
    externalUrl: urn ? `https://www.linkedin.com/feed/update/${urn}` : 'https://www.linkedin.com/feed/',
  };
}

export interface LinkedInRuntime {
  available: boolean;
  mode: 'live' | 'demo';
  reason: string;
  personUrn: string | null;
  accessToken: string | null;
  expiresAt: string | null;
}

export function getLinkedInRuntime(): LinkedInRuntime {
  const config = getLinkedInConfig();
  const account = getRawAccount('linkedin' as Platform);
  if (!account || account.status !== 'connected') {
    return {
      available: false,
      mode: 'demo',
      reason: 'LinkedIn is not connected. Connect it in Settings or keep using demo auto-posts.',
      personUrn: null,
      accessToken: null,
      expiresAt: null,
    };
  }
  if (account.mode !== 'live' || !account.accessToken) {
    return {
      available: true,
      mode: 'demo',
      reason: 'LinkedIn is connected in demo mode. Posts are simulated until real OAuth credentials are added.',
      personUrn: null,
      accessToken: null,
      expiresAt: null,
    };
  }
  const token = decryptToken(account.accessToken);
  if (!token) {
    return {
      available: false,
      mode: 'demo',
      reason: 'Stored LinkedIn token could not be decrypted. Reconnect LinkedIn.',
      personUrn: null,
      accessToken: null,
      expiresAt: null,
    };
  }
  if (account.expiresAt && new Date(account.expiresAt).getTime() < Date.now()) {
    return {
      available: false,
      mode: 'demo',
      reason: 'LinkedIn access token expired. Reconnect LinkedIn in Settings.',
      personUrn: null,
      accessToken: null,
      expiresAt: account.expiresAt,
    };
  }
  if (config.forceDemo) {
    return {
      available: true,
      mode: 'demo',
      reason: 'LINKEDIN_FORCE_DEMO is enabled. Posts are simulated even though a token is stored.',
      personUrn: (account.meta as AccountMeta).personUrn ?? null,
      accessToken: null,
      expiresAt: account.expiresAt,
    };
  }
  return {
    available: true,
    mode: 'live',
    reason: 'LinkedIn is connected with a live token. Auto-posting will publish for real.',
    personUrn: (account.meta as AccountMeta).personUrn ?? null,
    accessToken: token,
    expiresAt: account.expiresAt,
  };
}




