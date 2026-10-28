import { NextResponse } from 'next/server';
import { runDuePosts } from '@/lib/scheduler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  try {
    const result = await runDuePosts('manual', true);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
