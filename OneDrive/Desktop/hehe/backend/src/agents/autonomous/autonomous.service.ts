import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentService } from '../content/content.service';
import { TrendService } from '../trend/trend.service';
import { EmailService } from '../../email/email.service';
import { NotificationsService } from '../../notifications/notifications.service';

type ProfileShape = {
  platforms: string[];
  approvalRequired: boolean;
  postsPerWeek: unknown;
  autonomousMode?: boolean;
};

@Injectable()
export class AutonomousService {
  private readonly logger = new Logger(AutonomousService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contentService: ContentService,
    private readonly trendService: TrendService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── FEATURE 1: Autonomous Content Cron ───────────────────────────────────

  @Cron('0 9 * * *', { name: 'autonomous-content-gen' })
  async runAutonomousContentGen() {
    this.logger.log('[autonomous-content-gen] Starting cron run');
    const profiles = await this.prisma.brandProfile.findMany({
      where: { autonomousMode: true, onboardingComplete: true },
      select: {
        teamId: true,
        platforms: true,
        approvalRequired: true,
        postsPerWeek: true,
      },
    });

    this.logger.log(`[autonomous-content-gen] Found ${profiles.length} autonomous profiles`);
    for (const profile of profiles) {
      try {
        await this.generateForTeam(profile.teamId, profile);
      } catch (err) {
        this.logger.error(`[autonomous-content-gen] Failed for team ${profile.teamId}`, err);
      }
    }
    this.logger.log('[autonomous-content-gen] Cron run complete');
  }

  async generateForTeam(teamId: string, profile: ProfileShape) {
    // Validate: skip if no platforms or all postsPerWeek are 0
    const ppw = profile.postsPerWeek as Record<string, number>;
    const ppwValues = Object.values(ppw ?? {});
    if (ppwValues.length > 0 && ppwValues.every((v) => v === 0)) {
      this.logger.log(`[generateForTeam] Skipping team ${teamId} — all postsPerWeek are 0`);
      return { skipped: true };
    }

    // 1. Get today's top trend for this team
    const topTrend = await this.prisma.trendItem.findFirst({
      where: {
        teamId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { relevanceScore: 'desc' },
    });

    const topic = topTrend?.keyword ?? 'industry insights and tips';
    const intent = topTrend ? 'trending topic' : 'thought leadership';

    // 2. ContentService handles post creation internally — it reads autonomousMode
    //    from BrandProfile directly. We just call generate() and get back postIds.
    const result = await this.contentService.generate(teamId, {
      topic,
      platforms: profile.platforms,
      intent,
    });

    this.logger.log(
      `[generateForTeam] Team ${teamId}: generated ${result.postIds.length} posts (runId: ${result.runId})`,
    );
    return { postIds: result.postIds, topic, runId: result.runId };
  }

  // ─── FEATURE 2: Posting Gap Detector ──────────────────────────────────────

  @Cron('0 */6 * * *', { name: 'posting-gap-detector' })
  async detectPostingGaps() {
    this.logger.log('[posting-gap-detector] Starting cron run');
    const profiles = await this.prisma.brandProfile.findMany({
      where: { onboardingComplete: true },
      select: {
        teamId: true,
        platforms: true,
        approvalRequired: true,
        postsPerWeek: true,
        autonomousMode: true,
      },
    });

    for (const profile of profiles) {
      try {
        const ppw = profile.postsPerWeek as Record<string, number>;
        const ppwValues = Object.values(ppw ?? {});

        // Skip if ALL platforms have postsPerWeek = 0
        if (ppwValues.length > 0 && ppwValues.every((v) => v === 0)) continue;

        const gapDays = this.calcGapThreshold(ppw);
        const cutoff = new Date(Date.now() - gapDays * 24 * 60 * 60 * 1000);

        const recentPost = await this.prisma.post.findFirst({
          where: {
            teamId: profile.teamId,
            deletedAt: null,
            status: { in: ['published', 'scheduled', 'pending_approval'] },
            createdAt: { gte: cutoff },
          },
          select: { id: true },
        });

        if (!recentPost) {
          this.logger.warn(
            `[posting-gap-detector] Gap detected for team ${profile.teamId} (${gapDays}d threshold)`,
          );
          await this.createNotification(profile.teamId, 'gap_alert', {
            message: `You haven't posted in ${gapDays} days. Content has been queued automatically.`,
            gapDays,
          });
          if (profile.autonomousMode) {
            await this.generateForTeam(profile.teamId, profile);
          }
        }
      } catch (err) {
        this.logger.error(`[posting-gap-detector] Failed for team ${profile.teamId}`, err);
      }
    }
    this.logger.log('[posting-gap-detector] Cron run complete');
  }

  private calcGapThreshold(postsPerWeek: Record<string, number>): number {
    const values = Object.values(postsPerWeek ?? {});
    if (values.length === 0) return 3;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg >= 7) return 1;
    if (avg >= 4) return 2;
    return 3;
  }

  // ─── FEATURE 3: Viral Spike Detector ──────────────────────────────────────

  @Cron('0 * * * *', { name: 'viral-spike-detector' })
  async detectViralSpikes() {
    this.logger.log('[viral-spike-detector] Starting cron run');
    const teams = await this.prisma.team.findMany({
      select: { id: true },
      where: { posts: { some: { status: 'published', deletedAt: null } } },
    });

    for (const team of teams) {
      try {
        await this.checkSpikeForTeam(team.id);
      } catch (err) {
        this.logger.error(`[viral-spike-detector] Failed for team ${team.id}`, err);
      }
    }
    this.logger.log('[viral-spike-detector] Cron run complete');
  }

  private async checkSpikeForTeam(teamId: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const posts = await this.prisma.post.findMany({
      where: { teamId, status: 'published', deletedAt: null },
      select: {
        id: true,
        title: true,
        analytics: {
          where: { eventType: { contains: 'impressions' } },
          select: { count: true, collectedAt: true },
        },
      },
    });

    for (const post of posts) {
      const recent = post.analytics
        .filter((e) => e.collectedAt >= oneHourAgo)
        .reduce((sum, e) => sum + e.count, 0);

      const historical = post.analytics
        .filter((e) => e.collectedAt >= sevenDaysAgo && e.collectedAt < oneHourAgo)
        .reduce((sum, e) => sum + e.count, 0);

      // 7 days minus the last hour = 167 hours
      const historicalHourlyAvg = historical / 167;

      if (historicalHourlyAvg > 0 && recent > historicalHourlyAvg * 3) {
        const spikeMultiplier = Math.round(recent / historicalHourlyAvg);
        this.logger.log(
          `[viral-spike-detector] Post ${post.id} team ${teamId} — ${spikeMultiplier}× normal`,
        );
        await this.createNotification(teamId, 'viral_spike', {
          postId: post.id,
          postTitle: post.title,
          spikeMultiplier,
          recentImpressions: recent,
          message: `"${post.title.slice(0, 40)}" is going viral — ${spikeMultiplier}× normal impressions`,
        });
      }
    }
  }

  // ─── FEATURE 4: Engagement Feedback Loop ──────────────────────────────────

  @Cron('0 0 * * 0', { name: 'engagement-feedback-loop' })
  async runEngagementFeedbackLoop() {
    this.logger.log('[engagement-feedback-loop] Starting cron run');
    const profiles = await this.prisma.brandProfile.findMany({
      where: { onboardingComplete: true },
      select: { id: true, teamId: true, contentMix: true },
    });

    for (const profile of profiles) {
      try {
        await this.updateBrandVoiceFromPerformance(
          profile.teamId,
          profile.id,
          profile.contentMix as Record<string, number>,
        );
      } catch (err) {
        this.logger.error(
          `[engagement-feedback-loop] Failed for team ${profile.teamId}`,
          err,
        );
      }
    }
    this.logger.log('[engagement-feedback-loop] Cron run complete');
  }

  private async updateBrandVoiceFromPerformance(
    teamId: string,
    brandProfileId: string,
    currentMix: Record<string, number>,
  ) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const posts = await this.prisma.post.findMany({
      where: { teamId, status: 'published', deletedAt: null, createdAt: { gte: since } },
      include: {
        analytics: { select: { eventType: true, count: true } },
        platforms: { select: { platform: true } },
      },
    });

    if (posts.length < 5) {
      this.logger.log(
        `[feedback-loop] Team ${teamId}: only ${posts.length} posts, skipping (need ≥5)`,
      );
      return;
    }

    // Score each post
    const scored = posts.map((post) => {
      const impressions = post.analytics
        .filter((e) => e.eventType.includes('impressions'))
        .reduce((s, e) => s + e.count, 0);
      const engagements = post.analytics
        .filter((e) => /like|comment|share|engagement/.test(e.eventType))
        .reduce((s, e) => s + e.count, 0);
      const rate = impressions > 0 ? engagements / impressions : 0;
      const type =
        post.content.length < 100
          ? 'short'
          : post.content.length < 250
            ? 'medium'
            : 'long';
      return { post, rate, impressions, engagements, type };
    });

    // Top 5 posts → upsert as VoiceExamples
    const top5 = [...scored].sort((a, b) => b.rate - a.rate).slice(0, 5);

    for (const item of top5) {
      const exists = await this.prisma.voiceExample.findFirst({
        where: { brandProfileId, content: item.post.content },
      });
      if (!exists) {
        await this.prisma.voiceExample.create({
          data: {
            brandProfileId,
            content: item.post.content,
            platform: item.post.platforms[0]?.platform ?? null,
            performanceScore: Math.round(item.rate * 1000),
            source: 'performance',
          },
        });
      }
    }

    // Update contentMix based on type performance
    const typeScores: Record<string, { total: number; count: number }> = {};
    for (const item of scored) {
      if (!typeScores[item.type]) typeScores[item.type] = { total: 0, count: 0 };
      typeScores[item.type].total += item.rate;
      typeScores[item.type].count += 1;
    }

    const typeAvgs: Record<string, number> = {};
    for (const [t, s] of Object.entries(typeScores)) {
      typeAvgs[t] = s.count > 0 ? s.total / s.count : 0;
    }

    // Blend 70% existing mix + 30% performance signal
    const updatedMix = { ...currentMix };
    const totalScore = Object.values(typeAvgs).reduce((a, b) => a + b, 0);
    if (totalScore > 0) {
      for (const type of ['short', 'medium', 'long']) {
        const perfWeight = ((typeAvgs[type] ?? 0) / totalScore) * 100;
        const current = updatedMix[type] ?? 33;
        updatedMix[type] = Math.round(current * 0.7 + perfWeight * 0.3);
      }
    }

    await this.prisma.brandProfile.update({
      where: { teamId },
      data: { contentMix: updatedMix },
    });

    this.logger.log(
      `[feedback-loop] Team ${teamId}: contentMix updated → ${JSON.stringify(updatedMix)}`,
    );
  }

  // ─── FEATURE 5: Weekly Digest Email ───────────────────────────────────────

  @Cron('0 8 * * 1', { name: 'weekly-digest' })
  async sendWeeklyDigests() {
    this.logger.log('[weekly-digest] Starting cron run');
    const teams = await this.prisma.team.findMany({
      where: {
        brandProfile: { onboardingComplete: true },
      },
      include: {
        members: {
          where: { role: 'owner' },
          include: { user: { select: { email: true, name: true } } },
          take: 1,
        },
      },
    });

    for (const team of teams) {
      const owner = team.members[0]?.user;
      if (!owner?.email) continue;
      try {
        await this.sendDigestForTeam(team.id, owner.email, owner.name ?? 'there');
      } catch (err) {
        this.logger.error(`[weekly-digest] Failed for team ${team.id}`, err);
      }
    }
    this.logger.log('[weekly-digest] Cron run complete');
  }

  private async sendDigestForTeam(teamId: string, email: string, name: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const posts = await this.prisma.post.findMany({
      where: { teamId, status: 'published', deletedAt: null, createdAt: { gte: since } },
      include: { analytics: true, platforms: { select: { platform: true } } },
    });

    // Skip teams with no published posts in last 7 days
    if (posts.length === 0) {
      this.logger.log(`[weekly-digest] Team ${teamId}: no posts, skipping digest`);
      return;
    }

    const totalImpressions = posts
      .flatMap((p) => p.analytics)
      .filter((e) => e.eventType.includes('impressions'))
      .reduce((s, e) => s + e.count, 0);

    const totalEngagements = posts
      .flatMap((p) => p.analytics)
      .filter((e) => /like|comment|share|engagement/.test(e.eventType))
      .reduce((s, e) => s + e.count, 0);

    const engagementRate =
      totalImpressions > 0
        ? ((totalEngagements / totalImpressions) * 100).toFixed(1)
        : '0.0';

    const topPost = posts
      .map((p) => ({
        title: p.title,
        engagements: p.analytics
          .filter((e) => /like|comment|share|engagement/.test(e.eventType))
          .reduce((s, e) => s + e.count, 0),
      }))
      .sort((a, b) => b.engagements - a.engagements)[0];

    const appUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const appName = process.env.APP_NAME ?? 'Diyaa AI';

    await this.emailService.sendWeeklyDigest(email, {
      name,
      appName,
      appUrl,
      postsPublished: posts.length,
      totalImpressions,
      totalEngagements,
      engagementRate,
      topPostTitle: topPost?.title ?? 'N/A',
      topPostEngagements: topPost?.engagements ?? 0,
    });
  }

  // ─── Notification helper (delegates to NotificationsService) ──────────────

  private async createNotification(
    teamId: string,
    type: string,
    data: Record<string, unknown>,
  ) {
    const messages: Record<string, string> = {
      gap_alert: (data['message'] as string) ?? 'Posting gap detected',
      viral_spike: (data['message'] as string) ?? 'Post going viral',
    };
    await this.notificationsService.create(
      teamId,
      type,
      messages[type] ?? type,
      data,
    );
  }
}
