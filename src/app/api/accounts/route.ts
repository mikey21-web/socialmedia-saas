import { NextResponse } from 'next/server';
import { listAccounts } from '@/lib/db';
import { getLinkedInConfig, getLinkedInRuntime } from '@/lib/linkedin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const runtime = getLinkedInRuntime();
  return NextResponse.json({
    accounts: listAccounts(),
    linkedin: {
      configured: getLinkedInConfig().configured,
      runtime: { ...runtime, accessToken: undefined },
    },
  });
}
