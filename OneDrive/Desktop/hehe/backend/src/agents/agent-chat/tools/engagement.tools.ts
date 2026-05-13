import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { PrismaService } from '../../../prisma/prisma.service';
import { BrandService } from '../../../brand/brand.service';
import { LlmService } from '../../llm/llm.service';
import { NotificationsService } from '../../../notifications/notifications.service';
import { PendingApproval } from '../state';

export function buildEngagementTools(
  prisma: PrismaService,
  brandService: BrandService,
  llm: LlmService,
  notificationsService: NotificationsService,
  teamId: string,
): DynamicStructuredTool[] {
  const getUnansweredComments = new DynamicStructuredTool({
    name: 'getUnansweredComments',
    description: 'Fetch recent comments that have not been replied to yet',
    schema: z.object({
      limit: z.number().min(1).max(50).optional().defaulnnjjjot(20),
      platform: z.string().optional(),
    }),
    func: async ({ limit, platform }) => {
      const comments = await prisma.comment.findMany({
        where: {
          post: { teamId },
          replies: { none: {} },
          deletedAt: null,
          ...(platform ? { platform } : {}),
        },
        include: {
          post: { select: { title: true, platforms: { select: { platform: true } } } },
        },
        take: limit ?? 20,
        orderBy: { createdAt: 'desc' },
      });

      const result = comments.map(c => ({
        id: c.id,
        content: c.content,
        authorId: c.authorId,
        platform: c.platform,
        postTitle: c.post.title,
        postPlatforms: c.post.platforms.map(p => p.platform),
        createdAt: c.createdAt.toISOString(),
      }));

      return JSON.stringify({ comments: result, total: result.length });
    },
  });

  const draftReplies = new DynamicStructuredTool({
    name: 'draftReplies',
    description: 'Generate AI-drafted reply suggestions for a list of comments',
    schema: z.object({
      commentIds: z.array(z.string()),
    }),
    func: async ({ commentIds }) => {
      let brand: { brandName: string; voice: { tone: string } } | null = null;
      try {
        brand = await brandService.getBrandContext(teamId);
      } catch {
        brand = { brandName: 'our team', voice: { tone: 'professional' } };
      }

      const comments = await prisma.comment.findMany({
        where: { id: { in: commentIds }, post: { teamId } },
        include: { post: { select: { title: true, platforms: { select: { platform: true } } } } },
      });

      const drafts: Array<{ commentId: string; suggestedReply: string; commentContent: string }> = [];
      const pendingApprovals: PendingApproval[] = [];

      for (const comment of comments) {
        const platform = comment.post.platforms[0]?.platform ?? 'social media';
        try {
          const reply = await llm.complete(
            `You are ${brand.brandName} on ${platform}. Tone: ${brand.voice.tone}.\nReply to this comment on post "${comment.post.title}":\n"${comment.content}"\nKeep it authentic, engaging, under 280 characters.`,
          );

          drafts.push({
            commentId: comment.id,
            suggestedReply: reply,
            commentContent: comment.content,
          });

          pendingApprovals.push({
            type: 'reply',
            data: {
              commentId: comment.id,
              commentContent: comment.content,
              suggestedReply: reply,
              platform,
            },
            approvalId: crypto.randomUUID(),
          });
        } catch {
          // skip failed reply generation
        }
      }

      return JSON.stringify({ drafts, pendingApprovals });
    },
  });

  const submitReply = new DynamicStructuredTool({
    name: 'submitReply',
    description: 'Submit a reply to a comment',
    schema: z.object({
      commentId: z.string(),
      replyText: z.string(),
    }),
    func: async ({ commentId, replyText }) => {
      const parent = await prisma.comment.findFirst({
        where: { id: commentId, post: { teamId } },
        include: { post: { select: { id: true } } },
      });
      if (!parent) return JSON.stringify({ error: 'Comment not found' });

      const reply = await prisma.comment.create({
        data: {
          postId: parent.post.id,
          content: replyText,
          platform: parent.platform,
          authorId: 'agent',
          parentCommentId: commentId,
        },
      });

      // TODO: call platform API to post the reply on the actual social platform

      await notificationsService.create(
        teamId,
        'post_published',
        `Reply submitted to comment on post`,
      );

      return JSON.stringify({ success: true, replyId: reply.id });
    },
  });

  const getEngagementSummary = new DynamicStructuredTool({
    name: 'getEngagementSummary',
    description: 'Get an overview of recent engagement activity: comment counts, reply rates, and response times',
    schema: z.object({
      lookbackDays: z.number().min(1).max(90).optional().default(7),
    }),
    func: async ({ lookbackDays }) => {
      const since = new Date();
      since.setDate(since.getDate() - (lookbackDays ?? 7));

      const totalComments = await prisma.comment.count({
        where: {
          post: { teamId },
          createdAt: { gte: since },
          deletedAt: null,
          parentCommentId: null,
        },
      });

      const repliedComments = await prisma.comment.count({
        where: {
          post: { teamId },
          createdAt: { gte: since },
          deletedAt: null,
          parentCommentId: null,
          replies: { some: {} },
        },
      });

      const unanswered = await prisma.comment.count({
        where: {
          post: { teamId },
          createdAt: { gte: since },
          deletedAt: null,
          parentCommentId: null,
          replies: { none: {} },
        },
      });

      const replyRate = totalComments > 0
        ? Math.round((repliedComments / totalComments) * 100)
        : 0;

      return JSON.stringify({
        success: true,
        lookbackDays,
        totalComments,
        repliedComments,
        unanswered,
        replyRatePercent: replyRate,
      });
    },
  });

  const flagSpamComments = new DynamicStructuredTool({
    name: 'flagSpamComments',
    description: 'Use AI to identify and flag likely spam or bot comments from recent engagement',
    schema: z.object({
      limit: z.number().min(1).max(50).optional().default(20),
    }),
    func: async ({ limit }) => {
      const comments = await prisma.comment.findMany({
        where: {
          post: { teamId },
          deletedAt: null,
          parentCommentId: null,
        },
        orderBy: { createdAt: 'desc' },
        take: limit ?? 20,
        select: { id: true, content: true, authorId: true, platform: true },
      });

      if (!comments.length) {
        return JSON.stringify({ success: true, flagged: [], total: 0 });
      }

      const batch = comments.map(c => `[${c.id}] "${c.content}"`).join('\n');
      const response = await llm.complete(
        `Review these social media comments and identify which are likely spam, bot-generated, or irrelevant. Return a JSON object: { "spamIds": ["id1", "id2"], "reasons": { "id1": "reason" } }\n\nComments:\n${batch}`,
      );

      try {
        const parsed = JSON.parse(response) as { spamIds: string[]; reasons: Record<string, string> };
        const flagged = comments
          .filter(c => parsed.spamIds.includes(c.id))
          .map(c => ({
            id: c.id,
            content: c.content,
            reason: parsed.reasons[c.id] ?? 'Suspected spam',
          }));
        return JSON.stringify({ success: true, flagged, total: flagged.length });
      } catch {
        return JSON.stringify({ success: false, error: 'Failed to analyze comments' });
      }
    },
  });

  return [getUnansweredComments, draftReplies, submitReply, getEngagementSummary, flagSpamComments];
}
