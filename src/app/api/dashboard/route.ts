import { NextResponse } from 'next/server';
import { getAiConfig } from '@/lib/ai';
import {
  getAnalytics,
  getPlatformBreakdown,
  getProfile,
  getRecentPosts,
  getTotals,
  getUpcoming,
  listAccounts,
  listActivity,
} from '@/lib/db';
import { getSchedulerStatus } from '@/lib/scheduler';
import type { DashboardData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const profile = getProfile();
    const totals = getTotals();
    const ai = getAiConfig();
    const scheduler = getSchedulerStatus();

    const data: DashboardData = {
      profile,
      totals: { ...totals, followers: profile.followers },
      accounts: listAccounts(),
      analytics: getAnalytics(30),
      platformBreakdown: getPlatformBreakdown(30),
      upcoming: getUpcoming(5),
      recentPosts: getRecentPosts(6),
      activity: listActivity(12),
      ai: { configured: ai.configured, mode: ai.mode, model: ai.model },
      scheduler,
    };
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
