import { NextResponse } from 'next/server';
import { getAnalytics, getPlatformBreakdown, getTotals } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(Number(searchParams.get('days') ?? 30), 7), 90);
    return NextResponse.json({
      days,
      points: getAnalytics(days),
      platforms: getPlatformBreakdown(days),
      totals: getTotals(),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
