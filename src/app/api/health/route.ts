import { NextResponse } from 'next/server';
import { getAiConfig } from '@/lib/ai';
import { getDb, getTotals } from '@/lib/db';
import { getLinkedInConfig, getLinkedInRuntime } from '@/lib/linkedin';
import { getSchedulerStatus } from '@/lib/scheduler';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
    return NextResponse.json({
      ok: true,
      app: 'socialmedia-saas-local',
      time: new Date().toISOString(),
      database: 'sqlite',
      totals: getTotals(),
      ai: getAiConfig(),
      scheduler: getSchedulerStatus(),
      linkedin: {
        configured: getLinkedInConfig().configured,
        ...getLinkedInRuntime(),
        accessToken: undefined,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
