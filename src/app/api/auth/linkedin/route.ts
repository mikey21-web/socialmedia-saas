import { NextResponse } from 'next/server';
import { randomState } from '@/lib/crypto';
import { createOAuthState } from '@/lib/db';
import { buildLinkedInAuthUrl, getLinkedInConfig } from '@/lib/linkedin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const config = getLinkedInConfig();
  if (!config.configured) {
    return NextResponse.redirect(`${appUrl}/settings?linkedin=unconfigured`);
  }
  const state = randomState();
  createOAuthState(state);
  return NextResponse.redirect(buildLinkedInAuthUrl(state));
}
