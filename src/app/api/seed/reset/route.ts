import { NextResponse } from 'next/server';
import { resetDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    resetDatabase();
    return NextResponse.json({ ok: true, message: 'Demo data reset.' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
