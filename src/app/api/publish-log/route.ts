import { NextResponse } from 'next/server';
import { getPublishLog } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 20), 1), 100);
  return NextResponse.json({ entries: getPublishLog(limit) });
}
