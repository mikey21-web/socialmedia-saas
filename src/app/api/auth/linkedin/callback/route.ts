import { NextResponse } from 'next/server';
import { encryptToken } from '@/lib/crypto';
import { addActivity, consumeOAuthState, saveConnectedAccount } from '@/lib/db';
import { exchangeLinkedInCode, fetchLinkedInProfile } from '@/lib/linkedin';

export const dynamic = 'force-dynamic';

function redirectToSettings(params: Record<string, string>): NextResponse {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const query = new URLSearchParams(params).toString();
  return NextResponse.redirect(`${appUrl}/settings?${query}`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  if (error) {
    return redirectToSettings({
      linkedin: 'error',
      message: errorDescription || error,
    });
  }

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code || !state) {
    return redirectToSettings({ linkedin: 'error', message: 'LinkedIn did not return a code and state.' });
  }
  if (!consumeOAuthState(state)) {
    return redirectToSettings({ linkedin: 'error', message: 'OAuth state expired or invalid. Try again.' });
  }

  try {
    const token = await exchangeLinkedInCode(code);
    const profile = await fetchLinkedInProfile(token.access_token);
    const expiresAt = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : null;
    const personUrn = `urn:li:person:${profile.sub}`;

    saveConnectedAccount({
      platform: 'linkedin',
      handle: profile.name,
      displayName: profile.name,
      accessToken: encryptToken(token.access_token),
      refreshToken: token.refresh_token ? encryptToken(token.refresh_token) : null,
      expiresAt,
      meta: {
        personUrn,
        profileUrl: 'https://www.linkedin.com/in/me',
        picture: profile.picture,
      },
    });
    addActivity('connect', `LinkedIn connected as ${profile.name}. Auto-posting is now live.`);

    return redirectToSettings({ linkedin: 'connected' });
  } catch (error) {
    const message = (error as Error).message.slice(0, 300);
    addActivity('fail', `LinkedIn connection failed: ${message}`);
    return redirectToSettings({ linkedin: 'error', message });
  }
}
