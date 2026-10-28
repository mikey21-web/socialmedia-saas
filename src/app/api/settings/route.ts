import { NextResponse } from 'next/server';
import { getAiConfig, getGroqKey } from '@/lib/ai';
import {
  addActivity,
  getSetting,
  isAutopilotEnabled,
  isLinkedInAutoPostEnabled,
  setSetting,
} from '@/lib/db';
import { getLinkedInConfig, getLinkedInRuntime } from '@/lib/linkedin';
import { getSchedulerStatus } from '@/lib/scheduler';
import { parseBoolean } from '@/lib/validate';

export const dynamic = 'force-dynamic';

function payload() {
  const config = getLinkedInConfig();
  const runtime = getLinkedInRuntime();
  const key = getGroqKey();
  return {
    ai: {
      ...getAiConfig(),
      keySource: process.env.GROQ_API_KEY ? 'environment' : getSetting('groq_api_key') ? 'local' : 'none',
      keyMasked: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : null,
      forceMock: process.env.GROQ_FORCE_MOCK === 'true',
    },
    autopilot: isAutopilotEnabled(),
    linkedinAutoPost: isLinkedInAutoPostEnabled(),
    scheduler: getSchedulerStatus(),
    linkedin: {
      configured: config.configured,
      redirectUri: config.redirectUri,
      version: config.version,
      forceDemo: config.forceDemo,
      runtime: { ...runtime, accessToken: undefined },
    },
    appUrl: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, ''),
  };
}

export async function GET() {
  return NextResponse.json(payload());
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const autopilot = parseBoolean(body.autopilot);
    if (autopilot !== undefined) {
      setSetting('autopilot', autopilot ? 'true' : 'false');
      addActivity(
        'settings',
        autopilot
          ? 'Autopilot enabled. Due posts publish automatically.'
          : 'Autopilot paused. Due posts stay scheduled.'
      );
    }

    const linkedinAutoPost = parseBoolean(body.linkedinAutoPost);
    if (linkedinAutoPost !== undefined) {
      setSetting('linkedin_auto_post', linkedinAutoPost ? 'true' : 'false');
      addActivity(
        'settings',
        linkedinAutoPost ? 'LinkedIn auto-posting enabled.' : 'LinkedIn auto-posting disabled.'
      );
    }

    if (body.groqApiKey !== undefined) {
      const raw = String(body.groqApiKey ?? '').trim();
      if (raw === '') {
        setSetting('groq_api_key', '');
        addActivity('settings', 'Local Groq API key cleared. Mock generation will be used if no env key exists.');
      } else {
        if (raw.length < 8) throw new Error('That Groq API key looks too short');
        setSetting('groq_api_key', raw);
        addActivity('settings', 'Groq API key saved locally. AI generation will use live Groq calls.');
      }
    }

    return NextResponse.json(payload());
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
