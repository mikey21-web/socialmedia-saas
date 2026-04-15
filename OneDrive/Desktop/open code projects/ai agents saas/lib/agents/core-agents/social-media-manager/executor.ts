/**
 * Social Media Manager Agent - Main Orchestrator
 * Coordinates content creation, scheduling, engagement analysis, and analytics
 */

import {
  AgentExecutor,
  AgentExecutorContext,
  AgentExecutorResult,
  AgentStepLog,
} from '@/lib/agents/executor-types';
import { generateContent } from './content-creator';
import { scheduleContent } from './scheduler';
import { analyzeEngagement } from './engagement';
import { generateAnalytics } from './analytics';

/**
 * Execute the complete social media management workflow
 */
export const executeSocialMediaManager: AgentExecutor = async (
  userMessage: string,
  ctx: AgentExecutorContext
): Promise<AgentExecutorResult> => {
  const steps: AgentStepLog[] = [];

  try {
    // Step 1: Content Creation
    const t1 = Date.now();
    const content = await generateContent(
      userMessage,
      (ctx.metadata?.businessType as string) || 'unknown'
    );
    const contentDuration = Date.now() - t1;
    steps.push({
      stepName: 'content_creation',
      status: 'completed',
      durationMs: contentDuration,
      output: { postsGenerated: content.length, platforms: content.map((p) => p.platform) },
    });

    // Step 2: Content Scheduling
    const t2 = Date.now();
    const scheduled = await scheduleContent(content);
    const scheduleDuration = Date.now() - t2;
    steps.push({
      stepName: 'content_scheduling',
      status: 'completed',
      durationMs: scheduleDuration,
      output: {
        scheduledPosts: scheduled.count,
        scheduledDates: scheduled.scheduledDates,
        platformBreakdown: scheduled.platformBreakdown,
      },
    });

    // Step 3: Engagement Analysis
    const t3 = Date.now();
    const engagement = await analyzeEngagement(content);
    const engagementDuration = Date.now() - t3;
    steps.push({
      stepName: 'engagement_analysis',
      status: 'completed',
      durationMs: engagementDuration,
      output: {
        engagementScore: engagement.score,
        strengths: engagement.strengths,
        improvements: engagement.improvements,
      },
    });

    // Step 4: Analytics Generation
    const t4 = Date.now();
    const analytics = await generateAnalytics(content, scheduled, engagement);
    const analyticsDuration = Date.now() - t4;
    steps.push({
      stepName: 'analytics_generation',
      status: 'completed',
      durationMs: analyticsDuration,
      output: {
        totalReach: analytics.totalReach,
        engagementRate: analytics.engagementRate,
        conversionPotential: analytics.conversionPotential,
        recommendations: analytics.recommendations,
      },
    });

    const totalDuration = contentDuration + scheduleDuration + engagementDuration + analyticsDuration;

    const data: Record<string, unknown> = {
      postsGenerated: content.length,
      platformsCovered: ['Instagram', 'Twitter', 'LinkedIn', 'Facebook', 'TikTok'],
      engagementScore: engagement.score,
      totalReach: analytics.totalReach,
      engagementRate: (analytics.engagementRate * 100).toFixed(2),
      conversionPotential: (analytics.conversionPotential * 100).toFixed(2),
      scheduledDates: scheduled.scheduledDates,
      recommendations: analytics.recommendations,
      totalDurationMs: totalDuration,
    };

    return {
      success: true,
      runId: ctx.runId,
      message: `Social Media strategy complete: ${content.length} posts scheduled. Engagement score: ${Math.round(engagement.score)}/100. Expected reach: ${Math.round(analytics.totalReach).toLocaleString()} impressions.`,
      data,
      steps,
    };
  } catch (error) {
    return {
      success: false,
      runId: ctx.runId,
      message: 'Social Media Manager execution failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      steps,
    };
  }
};
