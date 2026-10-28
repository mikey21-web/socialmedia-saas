import { NextResponse } from 'next/server';
import { getAiConfig, getGroqKey } from '@/lib/ai';
import { getSetting } from '@/lib/db';

export const dynamic = 'force-dynamic';

export function GET() {
  const config = getAiConfig();
  const key = getGroqKey();
  const source = process.env.GROQ_API_KEY ? 'environment' : getSetting('groq_api_key') ? 'local' : 'none';
  return NextResponse.json({
    ...config,
    keySource: source,
    keyMasked: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : null,
    forceMock: process.env.GROQ_FORCE_MOCK === 'true',
  });
}
