import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmService } from '../../agents/llm/llm.service';
import { StrategistService } from '../specialists/strategist/strategist.service';
import { CopywriterService } from '../specialists/copywriter/copywriter.service';
import { DesignerService } from '../specialists/designer/designer.service';
import { AnalystService } from '../specialists/analyst/analyst.service';
import { EngagementManagerService } from '../specialists/engagement-manager/engagement-manager.service';
import { TrendMonitorService } from '../trends/trend-monitor.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { UgcVideoService } from '../specialists/ugc-video/ugc-video.service';
import { AgentRunLoggerService } from '../agent-run-logger.service';
import { buildBossPrompt, buildReviewPrompt, BossDecision, ReviewDecision } from './boss-agent.prompt';

export interface BossThought {
  id: string;
  timestamp: Date;
  type: 'assessment' | 'decision' | 'delegation' | 'review' | 'correction' | 'complete';
  agent?: string;
  message: string;
  reasoning?: string;
  data?: Record<string, unknown>;
}

export interface BossCycleResult {
  thoughts: BossThought[];
  postsGenerated: number;
  engagementProcessed: number;
  decisionsOverridden: number;
  durationMs: number;
}

@Injectable()
export class BossAgentService {
  private readonly logger = new Logger(BossAgentService.name);
  private readonly liveThoughts = new Map<string, BossThought[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly strategist: StrategistService,
    private readonly copywriter: CopywriterService,
    private readonly designer: DesignerService,
    private readonly analyst: AnalystService,
    private readonly engagement: EngagementManagerService,
    private readonly trendMonitor: TrendMonitorService,
    private readonly ugcVideo: UgcVideoService,
    private readonly notifications: NotificationsService,
    private readonly runLogger: AgentRunLoggerService,
  ) {}

  // ─── Public: get live thoughts stream for a team ──────────────────────────
  getLiveThoughts(teamId: string): BossThought[] {
    return this.liveThoughts.get(teamId) ?? [];
  }

  // ─── Public: run the intelligent daily cycle ──────────────────────────────
  async runIntelligentCycle(teamId: string): Promise<BossCycleResult> {
    const start = Date.now();
    const thoughts: BossThought[] = [];
    this.liveThoughts.set(teamId, thoughts);

    const runId = `boss-${Date.now()}`;
    await this.runLogger.start(teamId, 'boss', runId, 'intelligent_cycle', {});

    let postsGenerated = 0;
    let engagementProcessed = 0;
    let decisionsOverridden = 0;

    try {
      // ── Phase 1: Gather situation ──────────────────────────────────────
      this.addThought(thoughts, 'assessment', undefined,
        'Good morning. Let me assess the current situation before making any decisions.',
      );

      const situation = await this.gatherSituation(teamId);
      this.addThought(thoughts, 'assessment', undefined,
        `Here's what I see:\n• ${situation.performanceSummary}\n• ${situation.strategySummary}\n• ${situation.engagementSummary}\n• ${situation.trendSummary}`,
        undefined,
        { situation },
      );

      // ── Phase 2: LLM decides what to do ────────────────────────────────
      this.addThought(thoughts, 'decision', undefined,
        'Analyzing the situation and creating today\'s action plan...',
      );

      const bossPrompt = buildBossPrompt(situation);
      const decision = await this.llm.completeJson<BossDecision>(bossPrompt, {
        temperature: 0.4,
        maxTokens: 2048,
      });

      this.addThought(thoughts, 'decision', undefined,
        `Decision made: ${decision.reasoning}`,
        decision.reasoning,
        { plan: decision.tasks },
      );

      // ── Phase 3: Execute tasks in the order the boss decided ───────────
      for (const task of decision.tasks) {
        const agent = task.agent;
        const instruction = task.instruction;
        const priority = task.priority;

        this.addThought(thoughts, 'delegation', agent,
          `${this.agentEmoji(agent)} ${this.agentName(agent)}, ${instruction}`,
          `Priority: ${priority}. ${task.reasoning}`,
        );

        try {
          const result = await this.executeTask(teamId, task, situation);

          // ── Phase 4: Review specialist output ──────────────────────────
          if (task.reviewRequired && result.output) {
            this.addThought(thoughts, 'review', agent,
              `Let me review what ${this.agentName(agent)} produced...`,
            );

            const reviewPrompt = buildReviewPrompt(agent, task.instruction, result.output);
            const review = await this.llm.completeJson<ReviewDecision>(reviewPrompt, {
              temperature: 0.3,
              maxTokens: 1024,
            });

            if (review.approved) {
              this.addThought(thoughts, 'review', agent,
                `${this.agentName(agent)}'s work looks good. ${review.feedback}`,
                review.reasoning,
              );
            } else {
              // ── Phase 5: Course correct ──────────────────────────────
              decisionsOverridden++;
              this.addThought(thoughts, 'correction', agent,
                `${this.agentName(agent)}, I need you to redo this. ${review.feedback}`,
                review.reasoning,
              );

              // Retry with boss feedback
              const retryResult = await this.executeTask(teamId, {
                ...task,
                instruction: `REVISION REQUIRED: ${review.feedback}. Original task: ${instruction}`,
                reviewRequired: false,
              }, situation);

              this.addThought(thoughts, 'review', agent,
                `Revision complete. Moving on.`,
                undefined,
                { retryOutput: retryResult.summary },
              );
            }
          }

          // Track metrics
          if (agent === 'copywriter') postsGenerated += result.count ?? 0;
          if (agent === 'engagement_manager') engagementProcessed += result.count ?? 0;

        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          this.addThought(thoughts, 'correction', agent,
            `${this.agentName(agent)} ran into a problem: ${errMsg}. Continuing with the rest of the plan.`,
          );
          this.logger.error(`Boss cycle: ${agent} task failed`, err);
        }
      }

      // ── Phase 6: Wrap up ───────────────────────────────────────────────
      this.addThought(thoughts, 'complete', undefined,
        `Daily cycle complete. ${postsGenerated} posts created, ${engagementProcessed} replies handled. ${decisionsOverridden > 0 ? `I had to send back ${decisionsOverridden} task(s) for revision.` : 'All tasks passed quality review.'}`,
      );

      await this.notifications.create(
        teamId,
        'boss_cycle_complete',
        `Boss Agent cycle complete: ${postsGenerated} posts, ${engagementProcessed} replies, ${decisionsOverridden} revisions.`,
      );

      await this.runLogger.succeed(runId, {
        postsGenerated,
        engagementProcessed,
        decisionsOverridden,
        totalTasks: decision.tasks.length,
      });

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.addThought(thoughts, 'complete', undefined,
        `Something went wrong during the cycle: ${errMsg}. Partial work may have been saved.`,
      );
      await this.runLogger.fail(runId, errMsg);
    }

    const result: BossCycleResult = {
      thoughts,
      postsGenerated,
      engagementProcessed,
      decisionsOverridden,
      durationMs: Date.now() - start,
    };

    // Persist thoughts to DB
    await this.persistThoughts(teamId, thoughts);

    return result;
  }

  // ─── Gather full situation report ─────────────────────────────────────────

  private async gatherSituation(teamId: string) {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      strategy,
      brandVoice,
      recentPosts,
      pendingEngagement,
      trendSignals,
      yesterdayLogs,
    ] = await Promise.all([
      this.strategist.getCurrentStrategy(teamId),
      this.prisma.brandVoice.findFirst({ where: { teamId, isActive: true } }),
      this.prisma.post.findMany({
        where: { teamId, createdAt: { gte: sevenDaysAgo }, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { title: true, content: true, status: true, impressions: true, scheduledAt: true, platforms: { select: { platform: true } } },
      }),
      this.prisma.engagementAction.count({ where: { teamId, status: 'pending' } }),
      this.prisma.trendSignal.findMany({
        where: { expiresAt: { gt: now } },
        orderBy: { popularity: 'desc' },
        take: 5,
      }),
      this.prisma.agentRunLog.findMany({
        where: { teamId, createdAt: { gte: yesterday } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const published = recentPosts.filter(p => p.status === 'published');
    const avgImpressions = published.length
      ? Math.round(published.reduce((s, p) => s + (p.impressions ?? 0), 0) / published.length)
      : 0;
    const scheduled = recentPosts.filter(p => p.status === 'scheduled');
    const drafts = recentPosts.filter(p => p.status === 'draft');
    const failedLogs = yesterdayLogs.filter(l => l.status === 'failed');

    return {
      teamId,
      hasStrategy: !!strategy,
      strategyName: strategy?.name ?? 'None',
      strategyDaysRemaining: strategy
        ? Math.max(0, Math.ceil((new Date(strategy.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0,
      hasBrandVoice: !!brandVoice,
      brandVoiceName: brandVoice?.name ?? 'None',
      publishedLast7Days: published.length,
      avgImpressions,
      scheduledPosts: scheduled.length,
      draftPosts: drafts.length,
      pendingEngagement,
      trendSignals: trendSignals.map(t => ({ platform: t.platform, value: t.value, popularity: t.popularity })),
      yesterdayAgentRuns: yesterdayLogs.length,
      failedRuns: failedLogs.length,
      failedAgents: [...new Set(failedLogs.map(l => l.agentRole))],
      performanceSummary: `${published.length} posts published in 7 days, avg ${avgImpressions} impressions`,
      strategySummary: strategy
        ? `Strategy "${strategy.name}" active, ${Math.max(0, Math.ceil((new Date(strategy.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))} days left`
        : 'No active strategy — need to create one',
      engagementSummary: `${pendingEngagement} pending replies waiting`,
      trendSummary: trendSignals.length > 0
        ? `${trendSignals.length} trending signals: ${trendSignals.slice(0, 3).map(t => t.value).join(', ')}`
        : 'No strong trends detected today',
    };
  }

  // ─── Execute a single task by dispatching to the right specialist ──────────

  private async executeTask(
    teamId: string,
    task: { agent: string; instruction: string; priority: string; reasoning: string; reviewRequired: boolean },
    situation: Awaited<ReturnType<BossAgentService['gatherSituation']>>,
  ): Promise<{ summary: string; output?: unknown; count?: number }> {
    switch (task.agent) {
      case 'analyst': {
        const insight = await this.analyst.generateDailyInsight(teamId);
        return { summary: `Generated daily insight. Needs adjustment: ${insight.needsAdjustment}`, output: insight, count: 1 };
      }
      case 'strategist': {
        if (task.instruction.toLowerCase().includes('refine') || task.instruction.toLowerCase().includes('adjust')) {
          const strategy = await this.strategist.getCurrentStrategy(teamId);
          if (strategy) {
            await this.strategist.refineStrategy(strategy.id);
            return { summary: 'Refined current strategy', count: 1 };
          }
          return { summary: 'No strategy to refine' };
        }
        const strategy = await this.strategist.getCurrentStrategy(teamId);
        if (strategy) {
          const briefs = await this.strategist.getDailyBriefs(strategy.id);
          return { summary: `Generated ${briefs.length} daily briefs`, output: briefs, count: briefs.length };
        }
        return { summary: 'No active strategy available' };
      }
      case 'copywriter': {
        const strategy = await this.strategist.getCurrentStrategy(teamId);
        const brandVoice = await this.prisma.brandVoice.findFirst({ where: { teamId, isActive: true } });
        if (!strategy || !brandVoice) {
          return { summary: 'Cannot write — missing strategy or brand voice', count: 0 };
        }
        const briefs = await this.strategist.getDailyBriefs(strategy.id);
        const maxPosts = task.priority === 'critical' ? 5 : task.priority === 'high' ? 3 : 2;
        const toProcess = briefs.slice(0, maxPosts);
        let count = 0;

        for (const brief of toProcess) {
          try {
            const post = await this.copywriter.generatePost({
              teamId,
              brandVoiceId: brandVoice.id,
              platform: brief.platform,
              pillarTopic: brief.pillarTopic,
              contentType: brief.contentType,
              targetWordCount: brief.targetWordCount,
              trendSignalId: brief.trendSignalId,
            });
            // Create draft post
            await this.prisma.post.create({
              data: {
                teamId,
                title: brief.pillarTopic,
                content: `${post.content}\n\n${post.hashtags.join(' ')}`,
                status: 'draft',
                mediaUrls: [],
              },
            });
            count++;
          } catch (err) {
            this.logger.warn(`Copywriter failed for brief: ${brief.pillarTopic}`);
          }
        }
        return { summary: `Wrote ${count} posts`, output: { count }, count };
      }
      case 'designer': {
        const drafts = await this.prisma.post.findMany({
          where: { teamId, status: 'draft', mediaUrls: { equals: [] } },
          take: 3,
        });
        let count = 0;
        for (const draft of drafts) {
          try {
            const image = await this.designer.generateImage({
              teamId,
              subject: draft.title ?? 'social media visual',
              style: 'clean, modern, professional',
              mood: 'engaging, vibrant',
              platform: ['instagram'],
              imageType: 'post',
            });
            await this.prisma.post.update({
              where: { id: draft.id },
              data: { mediaUrls: [image.sourceUrl] },
            });
            count++;
          } catch {
            this.logger.warn(`Designer failed for post ${draft.id}`);
          }
        }
        return { summary: `Generated ${count} images`, count };
      }
      case 'engagement_manager': {
        const backlog = await this.engagement.processBacklog(teamId);
        return { summary: `Processed ${backlog.processed} engagement items`, count: backlog.processed };
      }
      case 'trend_monitor': {
        const trends = await this.trendMonitor.getRelevantTrends(teamId);
        return { summary: `Found ${trends.length} relevant trends`, output: trends, count: trends.length };
      }
      case 'ugc_video': {
        // Extract topics from the instruction or fall back to existing briefs
        const strategy = await this.strategist.getCurrentStrategy(teamId);
        let topics: { topic: string; platform: string }[] = [];
        if (strategy) {
          const briefs = await this.strategist.getDailyBriefs(strategy.id);
          topics = briefs
            .filter(b => b.contentType === 'ugc')
            .map(b => ({ topic: b.pillarTopic, platform: b.platform }));
        }
        if (topics.length === 0) {
          topics = [{ topic: task.instruction, platform: 'instagram' }];
        }
        const ugcResult = await this.ugcVideo.generateFromBriefs(teamId, topics);
        return { summary: `Created ${ugcResult.count} UGC videos`, output: ugcResult, count: ugcResult.count };
      }
      default:
        return { summary: `Unknown agent: ${task.agent}` };
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private addThought(
    thoughts: BossThought[],
    type: BossThought['type'],
    agent: string | undefined,
    message: string,
    reasoning?: string,
    data?: Record<string, unknown>,
  ) {
    const thought: BossThought = {
      id: `thought-${Date.now()}-${thoughts.length}`,
      timestamp: new Date(),
      type,
      agent,
      message,
      reasoning,
      data,
    };
    thoughts.push(thought);
    this.logger.log(`[Boss] ${type}${agent ? ` → ${agent}` : ''}: ${message.slice(0, 100)}`);
  }

  private async persistThoughts(teamId: string, thoughts: BossThought[]) {
    try {
      await this.prisma.agentRunLog.create({
        data: {
          teamId,
          agentRole: 'boss',
          triggerType: 'intelligent_cycle',
          input: {},
          output: JSON.parse(JSON.stringify({ thoughts: thoughts.map(t => ({ ...t, timestamp: t.timestamp.toISOString() })) })),
          tokensUsed: 0,
          costInr: 0,
          durationMs: 0,
          status: 'success',
        },
      });
    } catch (err) {
      this.logger.error('Failed to persist boss thoughts', err);
    }
  }

  private agentName(id: string): string {
    const names: Record<string, string> = {
      analyst: 'Nova',
      strategist: 'Maya',
      copywriter: 'Alex',
      designer: 'Pixel',
      engagement_manager: 'Echo',
      trend_monitor: 'Radar',
    };
    return names[id] ?? id;
  }

  private agentEmoji(id: string): string {
    const emojis: Record<string, string> = {
      analyst: '📊',
      strategist: '🧠',
      copywriter: '✍️',
      designer: '🎨',
      engagement_manager: '💬',
      trend_monitor: '📡',
    };
    return emojis[id] ?? '🤖';
  }
}
