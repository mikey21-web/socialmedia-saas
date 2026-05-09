import { PrismaService } from '../../prisma/prisma.service';
import { AgencyOrchestratorService } from '../../agency/orchestrator/agency-orchestrator.service';
import { TrendMonitorService } from '../../agency/trends/trend-monitor.service';
import { AnalystService } from '../../agency/specialists/analyst/analyst.service';
import { DailyCycleWorkflowInput } from '../workflows/daily-cycle.workflow';
import { ReportGenerationWorkflowInput } from '../workflows/report-generation.workflow';
import { MetricsCollectionWorkflowInput } from '../workflows/metrics-collection.workflow';

export function createAgencyTemporalActivities(
  prisma: PrismaService,
  orchestrator: AgencyOrchestratorService,
  trendMonitor: TrendMonitorService,
  analyst: AnalystService,
) {
  return {
    async runDailyAgencyCycle(input: DailyCycleWorkflowInput) {
      return orchestrator.runDailyCycleForTeam(input.teamId);
    },

    async scanTrendSources() {
      const result = await trendMonitor.scanAllSources();
      const expired = await prisma.trendSignal.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      return { inserted: result.created, expired: expired.count };
    },

    async pollEngagementSources() {
      return { processed: 0 };
    },

    async generateAgencyReport(input: ReportGenerationWorkflowInput) {
      if (input.type === 'daily') {
        await analyst.generateDailyInsight(input.teamId);
      } else {
        await analyst.generateWeeklyReport(input.teamId);
      }
      return { reportType: input.type };
    },

    async scanCompetitors() {
      const active = await prisma.competitorTrack.count({ where: { isActive: true } });
      return { scanned: active };
    },

    async collectPostMetrics(input: MetricsCollectionWorkflowInput) {
      const platforms = await prisma.postPlatform.findMany({
        where: { postId: input.postId },
        select: { platform: true },
      });

      await Promise.all(platforms.map((platform) => prisma.postMetrics.create({
        data: {
          postId: input.postId,
          platform: platform.platform,
        },
      })));

      return { captured: platforms.length };
    },
  };
}
