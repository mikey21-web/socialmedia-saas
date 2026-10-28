import { NextResponse } from 'next/server';
import { getProfile, updateProfile } from '@/lib/db';
import type { Tone } from '@/lib/types';
import { cleanText, parseTone } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ profile: getProfile() });
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const profile = updateProfile({
      name: body.name !== undefined ? cleanText(body.name, 120) : undefined,
      email: body.email !== undefined ? cleanText(body.email, 160) : undefined,
      company: body.company !== undefined ? cleanText(body.company, 160) : undefined,
      role: body.role !== undefined ? cleanText(body.role, 160) : undefined,
      niche: body.niche !== undefined ? cleanText(body.niche, 400) : undefined,
      website: body.website !== undefined ? cleanText(body.website, 300) : undefined,
      tone: body.tone !== undefined ? ((parseTone(body.tone) ?? 'professional') as Tone) : undefined,
      brandVoice: body.brandVoice !== undefined ? cleanText(body.brandVoice, 4000) : undefined,
      signature: body.signature !== undefined ? cleanText(body.signature, 300) : undefined,
      followers: body.followers !== undefined ? Math.max(0, Number(body.followers) || 0) : undefined,
    });
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
