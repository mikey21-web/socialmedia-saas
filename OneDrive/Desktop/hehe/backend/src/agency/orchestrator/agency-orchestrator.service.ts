import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { StrategistService } from '../specialists/strategist/strategist.service';
import { CopywriterService } from '../specialists/copywriter/copywriter.service';
import { DesignerService } from '../specialists/designer/designer.service';
import { AnalystService } from '../specialists/analyst/analyst.service';
import { EngagementManagerService } from '../specialists/engagement-manager/engagement-manager.service';
import { TrendMonitorService } from '../trends/trend-monitor.service';
import { PublishingService } from '../../publishing/publishing.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class AgencyOrchestratorService {
  private readonly logger = new Logger(AgencyOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly strategist: StrategistService,
    private readonly copywriter: CopywriterService,
    private readonly designer: DesignerService,
    private readonly analyst: AnalystService,
    private readonly engagement: EngagementManagerService,
    private readonly trendMonitor: TrendMonitorService,
    private readonly publishing: PublishingService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('0 6 * * *')
  async dailyAgencyCycle(): Promise<void> {
    this.logger.log('Starting daily agency cycle');
    const activeTeams = await this.getActiveAgencyTeams();

    for (const team of activeTeams) {
      try {
        await this.runDailyCycleForTeam(team.id);
      } catch (err) {
        this.logger.error(`Daily cycle failed for team ${team.id}`, err);
      }
    }

    this.logger.log(`Daily agency cycle completed for ${activeTeams.length} teams`);
  }

  async runDailyCycleForTeam(teamId: string): Promise<{
    insights: { needsAdjustment: boolean };
    postsGenerated: number;
    engagementProcessed: number;
  }> {
    const start = Date.now();
    this.logger.log(`Running daily cycle for team ${teamId}`);

    // 1. Analyst: review yesterday's performance
    const yesterdayInsights = await this.analyst.generateDailyInsight(teamId);

    // 2. Strategist: check if strategy needs adjustment
    const strategy = await this.strategist.getCurrentStrategy(teamId);
    if (strategy && yesterdayInsights.needsAdjustment) {
      await this.strategist.refineStrategy(strategy.id);
      this.logger.log(`Strategy refined for team ${teamId}`);
    }

    // 3. Trend Monitor: pull relevant trends
    const _trends = await this.trendMonitor.getRelevantTrends(teamId);

    // 4. Get brand voice
    const brandVoice = await this.prisma.brandVoice.findFirst({
      where: { teamId, isActive: true },
    });

    let postsGenerated = 0;

    if (strategy && brandVoice) {
      // 5. Copywriter: generate today's content
      const briefs = await this.strategist.getDailyBriefs(strategy.id);
      const briefsToProcess = briefs.slice(0, 5);

      for (const brief of briefsToProcess) {
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

          // 6. Designer: generate visual
          let mediaUrl: string | undefined;
          if (post.imagePrompt) {
            try {
              const image = await this.designer.generateImage({
                teamId,
                prompt: post.imagePrompt,
                style: (post.style as 'photo' | 'illustration' | 'graphic' | 'meme') ?? 'graphic',
                aspectRatio: (post.aspectRatio as '1:1' | '9:16' | '16:9' | '4:5') ?? '1:1',
              });
              mediaUrl = image.url;
            } catch {
              this.logger.warn('Image generation failed, proceeding without image');
            }
          }

          // 7. Create draft post in DB
          const dbPost = await this.prisma.post.create({
            data: {
              teamId,
              title: brief.pillarTopic,
              content: `${post.content}\n\n${post.hashtags.join(' ')}`,
              status: 'draft',
              mediaUrls: mediaUrl ? [mediaUrl] : [],
            },
          });

          // 8. Schedule at optimal time
          const optimalHour = this.getOptimalHour(brief.platform);
          const scheduledAt = new Date();
          scheduledAt.setHours(optimalHour, 0, 0, 0);
          if (scheduledAt <= new Date()) {
            scheduledAt.setDate(scheduledAt.getDate() + 1);
          }

          await this.prisma.post.update({
            where: { id: dbPost.id },
            data: { status: 'scheduled', scheduledAt },
          });

          postsGenerated++;
        } catch (err) {
          this.logger.error(`Failed to generate post for brief: ${brief.pillarTopic}`, err);
        }
      }
    }

    // 9. Engagement Manager: process pending replies
    const backlog = await this.engagement.processBacklog(teamId);

    // 10. Notify team
    await this.notifications.create(
      teamId,
      'agency_daily_cycle',
      `Daily AI agency cycle complete: ${postsGenerated} posts generated, ${backlog.processed} engagement items processed.`,
    );

    this.logger.log(`Daily cycle for team ${teamId} completed in ${Date.now() - start}ms`);

    return {
      insights: { needsAdjustment: yesterdayInsights.needsAdjustment },
      postsGenerated,
      engagementProcessed: backlog.processed,
    };
  }

  async getStatus(teamId: string) {
    const [strategy, brandVoice, recentLogs, pendingActions] = await Promise.all([
      this.strategist.getCurrentStrategy(teamId),
      this.prisma.brandVoice.findFirst({ where: { teamId, isActive: true } }),
      this.prisma.agentRunLog.findMany({
        where: { teamId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.engagementAction.count({
        where: { teamId, status: 'pending' },
      }),
    ]);

    return {
      hasActiveStrategy: !!strategy,
      strategyName: strategy?.name,
      strategyDaysRemaining: strategy
        ? Math.max(0, Math.ceil((new Date(strategy.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0,
      hasBrandVoice: !!brandVoice,
      brandVoiceName: brandVoice?.name,
      recentAgentRuns: recentLogs.length,
      pendingEngagementActions: pendingActions,
    };
  }

  async pauseTeam(teamId: string) {
    const strategy = await this.strategist.getCurrentStrategy(teamId);
    if (strategy) {
      await this.prisma.contentStrategy.update({
        where: { id: strategy.id },
        data: { status: 'paused' },
      });
    }
    return { paused: true };
  }

  async resumeTeam(teamId: string) {
    const strategy = await this.prisma.contentStrategy.findFirst({
      where: { teamId, status: 'paused' },
      orderBy: { createdAt: 'desc' },
    });
    if (strategy) {
      await this.prisma.contentStrategy.update({
        where: { id: strategy.id },
        data: { status: 'active' },
      });
    }
    return { resumed: true };
  }

  private async getActiveAgencyTeams() {
    return this.prisma.team.findMany({
      where: {
        deletedAt: null,
        onboardingComplete: true,
        agencyTier: { not: 'solo' },
      },
      select: { id: true, agencyTier: true },
    });
  }

  private getOptimalHour(platform: string): number {
    const defaults: Record<string, number> = {
      instagram: 9,
      x: 8,
      linkedin: 10,
      facebook: 10,
      tiktok: 12,
    };
    return defaults[platform] ?? 9;
  }
}
