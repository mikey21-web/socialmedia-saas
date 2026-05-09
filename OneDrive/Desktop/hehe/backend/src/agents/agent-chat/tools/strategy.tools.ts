import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { PrismaService } from '../../../prisma/prisma.service';
import { ContentService } from '../../content/content.service';
import { LlmService } from '../../llm/llm.service';
import { PendingApproval } from '../state';

export function buildStrategyTools(
  prisma: PrismaService,
  contentService: ContentService,
  llm: LlmService,
  teamId: string,
): DynamicStructuredTool[] {
  const createGoal = new DynamicStructuredTool({
    name: 'createGoal',
    description: 'Create a growth goal for the team (e.g. reach 1000 followers in 90 days)',
    schema: z.object({
      title: z.string().describe('Short goal title'),
      description: z.string().describe('Detailed description of the goal'),
      targetMetric: z.enum(['followers', 'engagement_rate', 'impressions', 'posts_per_week']),
      targetValue: z.number().describe('Numeric target value'),
      platform: z.string().optional().describe('Specific platform, or omit for all platforms'),
      deadline: z.string().describe('ISO date string for the goal deadline'),
    }),
    func: async ({ title, description, targetMetric, targetValue, platform, deadline }) => {
      const goal = await prisma.goal.create({
        data: {
          teamId,
          title,
          description,
          targetMetric,
          targetValue,
          platform: platform ?? null,
          deadline: new Date(deadline),
          status: 'active',
        },
      });
      return JSON.stringify({ goalId: goal.id, message: `Goal created: ${title}` });
    },
  });

  const buildContentPlan = new DynamicStructuredTool({
    name: 'buildContentPlan',
    description: 'Build a content plan for a goal by generating draft posts for each theme',
    schema: z.object({
      goalId: z.string(),
      postsPerWeek: z.number().min(1).max(14),
      platforms: z.array(z.string()),
      themes: z.array(z.string()),
    }),
    func: async ({ goalId, postsPerWeek, platforms, themes }) => {
      const goal = await prisma.goal.findUnique({ where: { id: goalId, teamId } });
      if (!goal) return JSON.stringify({ error: 'Goal not found' });

      const pendingApprovals: PendingApproval[] = [];
      const postIds: string[] = [];
      const totalDrafts = Math.min(postsPerWeek * 2, themes.length * 2);

      for (let i = 0; i < Math.min(themes.length, totalDrafts); i++) {
        const theme = themes[i % themes.length];
        try {
          const result = await contentService.generate(teamId, {
            topic: theme,
            platforms,
            intent: 'awareness',
          });
          for (const postId of result.postIds) {
            postIds.push(postId);
            pendingApprovals.push({
              type: 'post_draft',
              data: { postId, topic: theme, platforms },
              approvalId: crypto.randomUUID(),
            });
          }
        } catch {
          // skip failed generation for this theme
        }
      }

      await prisma.goal.update({
        where: { id: goalId },
        data: { contentPlan: postIds },
      });

      return JSON.stringify({ draftsCreated: postIds.length, pendingApprovals });
    },
  });

  const trackGoalProgress = new DynamicStructuredTool({
    name: 'trackGoalProgress',
    description: 'Check the current progress of a goal against its target',
    schema: z.object({ goalId: z.string() }),
    func: async ({ goalId }) => {
      const goal = await prisma.goal.findUnique({ where: { id: goalId, teamId } });
      if (!goal) return JSON.stringify({ error: 'Goal not found' });

      let currentValue = goal.currentValue;

      if (goal.targetMetric === 'followers') {
        const snapshot = await prisma.followerSnapshot.findFirst({
          where: { teamId, ...(goal.platform ? { platform: goal.platform } : {}) },
          orderBy: { recordedAt: 'desc' },
        });
        currentValue = snapshot?.count ?? 0;
      } else if (goal.targetMetric === 'posts_per_week') {
        const since = new Date();
        since.setDate(since.getDate() - 7);
        currentValue = await prisma.post.count({
          where: {
            teamId,
            createdAt: { gte: since },
            status: { in: ['published', 'scheduled'] },
          },
        });
      }

      await prisma.goal.update({
        where: { id: goalId },
        data: { currentValue },
      });

      const progressPercent = goal.targetValue > 0
        ? Math.round((currentValue / goal.targetValue) * 100)
        : 0;

      const daysLeft = Math.ceil(
        (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      return JSON.stringify({
        title: goal.title,
        targetMetric: goal.targetMetric,
        targetValue: goal.targetValue,
        currentValue,
        progressPercent,
        status: goal.status,
        deadline: goal.deadline.toISOString(),
        daysLeft,
      });
    },
  });

  const createCampaign = new DynamicStructuredTool({
    name: 'createCampaign',
    description: 'Create a phased campaign with auto-generated post drafts for each phase',
    schema: z.object({
      name: z.string(),
      description: z.string(),
      launchDate: z.string().describe('ISO date string for launch'),
      platforms: z.array(z.string()),
      phases: z.array(z.object({
        name: z.string(),
        daysBeforeLaunch: z.number(),
        theme: z.string(),
        postCount: z.number().min(1).max(5),
      })),
    }),
    func: async ({ name, description, launchDate, platforms, phases }) => {
      const launch = new Date(launchDate);
      const campaign = await prisma.campaign.create({
        data: {
          teamId,
          name,
          description,
          startDate: launch,
          endDate: new Date(launch.getTime() + 30 * 24 * 60 * 60 * 1000),
          status: 'draft',
          platforms,
        },
      });

      const pendingApprovals: PendingApproval[] = [];
      let totalDrafts = 0;

      for (const phase of phases) {
        const phaseDate = new Date(launch.getTime() - phase.daysBeforeLaunch * 24 * 60 * 60 * 1000);
        for (let i = 0; i < Math.min(phase.postCount, 3); i++) {
          try {
            const result = await contentService.generate(teamId, {
              topic: phase.theme,
              platforms,
              intent: 'awareness',
            });
            for (const postId of result.postIds) {
              await prisma.post.update({
                where: { id: postId },
                data: { scheduledAt: phaseDate },
              });
              pendingApprovals.push({
                type: 'post_draft',
                data: { postId, phase: phase.name, scheduledAt: phaseDate.toISOString(), platforms },
                approvalId: crypto.randomUUID(),
              });
              totalDrafts++;
            }
          } catch {
            // skip failed generation
          }
        }
      }

      return JSON.stringify({
        campaignId: campaign.id,
        totalDrafts,
        phases: phases.map(p => p.name),
        pendingApprovals,
      });
    },
  });

  const suggestContentPillars = new DynamicStructuredTool({
    name: 'suggestContentPillars',
    description: 'Generate 4-6 core content themes aligned with the brand profile and business goals',
    schema: z.object({
      businessType: z.string().describe('e.g., SaaS, ecommerce, agency'),
      targetAudience: z.string(),
      goals: z.array(z.string()),
    }),
    func: async ({ businessType, targetAudience, goals }) => {
      const brand = await prisma.brandProfile.findUnique({
        where: { teamId },
        include: { pillars: true },
      });

      const existingPillars = brand?.pillars?.map(p => p.name) ?? [];

      const prompt = `Generate 5 content pillars for a ${businessType} targeting ${targetAudience} with goals: ${goals.join(', ')}.
${existingPillars.length ? `Existing pillars to build upon: ${existingPillars.join(', ')}` : ''}
Return a JSON object: { "pillars": [{ "name": "...", "description": "...", "exampleTopics": ["...", "..."] }] }`;

      const response = await llm.complete(prompt);
      try {
        const parsed = JSON.parse(response) as { pillars: Array<{ name: string; description: string; exampleTopics: string[] }> };
        return JSON.stringify({ success: true, pillars: parsed.pillars, existingPillars });
      } catch {
        return JSON.stringify({ success: true, rawSuggestion: response, existingPillars });
      }
    },
  });

  return [createGoal, buildContentPlan, trackGoalProgress, createCampaign, suggestContentPillars];
}
