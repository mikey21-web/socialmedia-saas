import { NextResponse } from 'next/server';
import { publishPost } from '@/lib/publishing';

export const dynamic = 'force-dynamic';

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const result = await publishPost(Number(id));
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
