import { NextResponse } from 'next/server';
import { connectDemoAccount, listAccounts } from '@/lib/db';
import { PLATFORMS } from '@/lib/types';
import type { Platform } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface Context {
  params: Promise<{ platform: string }>;
}

export async function POST(_request: Request, context: Context) {
  const { platform } = await context.params;
  if (!(PLATFORMS as readonly string[]).includes(platform)) {
    return NextResponse.json({ error: 'Unknown platform' }, { status: 400 });
  }
  connectDemoAccount(platform as Platform);
  return NextResponse.json({ accounts: listAccounts() });
}
