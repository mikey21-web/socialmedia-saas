import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { PrismaService } from '../../../prisma/prisma.service';
import { ContentService } from '../../content/content.service';
import { LlmService } from '../../llm/llm.service';
import { PendingApproval } from '../state';

export function buildContentTools(
  prisma: PrismaService,
  contentService: ContentService,
  llm: LlmService,
  teamId: string,
): DynamicStructuredTool[] {
  const createDraft = new DynamicStructuredTool({
    name: 'createDraft',
    description: 'Write a new social media post draft on a given topic',
    schema: z.object({
      topic: z.string(),
      platforms: z.array(z.string()),
      tone: z.string().optional(),
      includeHashtags: z.boolean().optional(),
    }),
    func: async ({ topic, platforms, tone }) => {
      const result = await contentService.generate(teamId, {
        topic,
        platforms,
        intent: tone ?? 'awareness',
      });

      const pendingApprovals: PendingApproval[] = result.postIds.map(postId => ({
        type: 'post_draft' as const,
        data: { postId, topic, platforms },
        approvalId: crypto.randomUUID(),
      }));

      const firstPost = result.postIds[0]
        ? await prisma.post.findUnique({ where: { id: result.postIds[0] } })
        : null;

      return JSON.stringify({
        postIds: result.postIds,
        preview: firstPost?.content?.slice(0, 200) ?? '',
        platforms,
        pendingApprovals,
      });
    },
  });

  const repurposeContent = new DynamicStructuredTool({
    name: 'repurposeContent',
    description: 'Repurpose existing content for multiple platforms',
    schema: z.object({
      sourceText: z.string(),
      sourcePlatform: z.string().optional(),
      targetPlatforms: z.array(z.string()),
    }),
    func: async ({ sourceText, targetPlatforms }) => {
      const repurposed: Array<{ platform: string; postId: string; preview: string }> = [];
      const pendingApprovals: PendingApproval[] = [];

      for (const platform of targetPlatforms) {
        try {
          const adapted = await llm.complete(
            `Repurpose this content for ${platform}. Follow ${platform} best practices for max length, hashtag style, and tone. Keep it authentic.\n\nOriginal content:\n${sourceText}`,
          );

          const post = await prisma.post.create({
            data: {
              teamId,
              title: `Repurposed for ${platform}`,
              content: adapted,
              status: 'draft',
              platforms: {
                create: [{ platform }],
              },
            },
          });

          const preview = adapted.slice(0, 200);
          repurposed.push({ platform, postId: post.id, preview });
          pendingApprovals.push({
            type: 'post_draft',
            data: { postId: post.id, platform, preview },
            approvalId: crypto.randomUUID(),
          });
        } catch {
          // skip failed platform
        }
      }

      return JSON.stringify({ repurposed, pendingApprovals });
    },
  });

  const schedulePost = new DynamicStructuredTool({
    name: 'schedulePost',
    description: 'Schedule an existing post draft for publishing at a specific time',
    schema: z.object({
      postId: z.string(),
      scheduledAt: z.string().describe('ISO datetime string'),
    }),
    func: async ({ postId, scheduledAt }) => {
      const post = await prisma.post.findFirst({ where: { id: postId, teamId } });
      if (!post) return JSON.stringify({ error: 'Post not found' });

      await prisma.post.update({
        where: { id: postId },
        data: {
          scheduledAt: new Date(scheduledAt),
          status: 'scheduled',
        },
      });

      return JSON.stringify({ postId, scheduledAt, status: 'scheduled' });
    },
  });

  const bulkSchedule = new DynamicStructuredTool({
    name: 'bulkSchedule',
    description: 'Schedule multiple posts at once',
    schema: z.object({
      posts: z.array(z.object({
        postId: z.string(),
        scheduledAt: z.string(),
      })),
    }),
    func: async ({ posts }) => {
      const results: Array<{ postId: string; scheduledAt: string }> = [];

      await prisma.$transaction(
        posts.map(({ postId, scheduledAt }) =>
          prisma.post.updateMany({
            where: { id: postId, teamId },
            data: { scheduledAt: new Date(scheduledAt), status: 'scheduled' },
          }),
        ),
      );

      for (const { postId, scheduledAt } of posts) {
        results.push({ postId, scheduledAt });
      }

      return JSON.stringify({ scheduled: results.length, posts: results });
    },
  });

  const generateHashtags = new DynamicStructuredTool({
    name: 'generateHashtags',
    description: 'Generate relevant hashtags for a post based on its content and target platform',
    schema: z.object({
      content: z.string().describe('Post content to generate hashtags for'),
      platform: z.enum(['x', 'instagram', 'linkedin', 'facebook', 'tiktok']),
      count: z.number().min(1).max(30).optional().describe('Number of hashtags (default 10)'),
    }),
    func: async ({ content, platform, count }) => {
      const hashtagCount = count ?? 10;
      const platformGuidelines: Record<string, string> = {
        x: '1-3 highly targeted hashtags',
        instagram: '15-25 mix of popular, niche, and branded hashtags',
        linkedin: '3-5 professional industry hashtags',
        facebook: '2-5 broad hashtags',
        tiktok: '3-8 trending and niche hashtags',
      };

      const prompt = `Generate exactly ${hashtagCount} relevant hashtags for this ${platform} post.
Platform best practice: ${platformGuidelines[platform] ?? ''}
Post content: "${content}"
Return a JSON object: { "hashtags": ["#tag1", "#tag2", ...], "categories": { "trending": ["..."], "niche": ["..."], "branded": ["..."] } }`;

      const response = await llm.complete(prompt);
      try {
        const parsed = JSON.parse(response) as { hashtags: string[]; categories?: Record<string, string[]> };
        return JSON.stringify({ success: true, hashtags: parsed.hashtags, categories: parsed.categories, platform });
      } catch {
        return JSON.stringify({ success: false, error: 'Failed to parse hashtags' });
      }
    },
  });

  return [createDraft, repurposeContent, schedulePost, bulkSchedule, generateHashtags];
}
