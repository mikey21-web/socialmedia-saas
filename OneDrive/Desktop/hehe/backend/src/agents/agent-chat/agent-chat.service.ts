import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentService } from '../content/content.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import { BrandService } from '../../brand/brand.service';
import { TrendService } from '../trend/trend.service';
import { CompetitorService } from '../competitor/competitor.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { LlmService } from '../llm/llm.service';
import { AgentName, AgentDeps, buildAgentForTeam } from './agent.graph';
import { HumanMessage } from '@langchain/core/messages';
import { PendingApproval } from './state';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  agentName?: AgentName;
  toolCalls?: unknown;
}

export interface ChatResponse {
  sessionId: string;
  reply: string;
  agentName: AgentName;
  pendingApprovals: PendingApproval[];
  toolCallsMade: number;
}

@Injectable()
export class AgentChatService {
  private readonly logger = new Logger(AgentChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contentService: ContentService,
    private readonly analyticsService: AnalyticsService,
    private readonly brandService: BrandService,
    private readonly trendService: TrendService,
    private readonly competitorService: CompetitorService,
    private readonly notificationsService: NotificationsService,
    private readonly llm: LlmService,
  ) {}

  async chat(
    teamId: string,
    userMessage: string,
    agentName: AgentName,
    sessionId?: string,
  ): Promise<ChatResponse> {
    const session = sessionId
      ? await this.getOrCreateSession(teamId, sessionId)
      : await this.createSession(teamId, userMessage);

    const history = await this.prisma.agentMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 30, // last 30 messages for context
    });

    const deps: AgentDeps = {
      prisma: this.prisma,
      contentService: this.contentService,
      analyticsService: this.analyticsService,
      brandService: this.brandService,
      trendService: this.trendService,
      competitorService: this.competitorService,
      notificationsService: this.notificationsService,
      llm: this.llm,
      teamId,
    };

    const agent = buildAgentForTeam(agentName, deps);

    // Reconstruct messages for the agent from history
    const messages = history.map(m => {
      if (m.role === 'user') return new HumanMessage(m.content);
      return new HumanMessage({ content: m.content }); // simplified for context
    });
    messages.push(new HumanMessage(userMessage));

    // Save user message
    await this.prisma.agentMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: userMessage,
        agentName,
      },
    });

    let reply = '';
    const pendingApprovals: PendingApproval[] = [];
    let toolCallsMade = 0;

    try {
      const result = await agent.invoke({ messages });

      const lastMsg = result.messages[result.messages.length - 1];
      reply =
        typeof lastMsg?.content === 'string'
          ? lastMsg.content
          : JSON.stringify(lastMsg?.content ?? '');

      // Extract pending approvals from tool results
      for (const msg of result.messages) {
        if (msg._getType() === 'tool') {
          toolCallsMade++;
          const toolContent =
            typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
          try {
            const parsed = JSON.parse(toolContent) as {
              pendingApprovals?: PendingApproval[];
            };
            if (parsed.pendingApprovals) {
              pendingApprovals.push(...parsed.pendingApprovals);
            }
          } catch {
            // tool result is not JSON
          }
        }
      }
    } catch (err) {
      this.logger.error(`Agent [${agentName}] error for team ${teamId}:`, err);
      reply = `I encountered an error while processing your request. Please try again or rephrase your question.`;
    }

    // Save assistant message
    await this.prisma.agentMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: reply,
        agentName,
        toolCalls: pendingApprovals.length > 0 ? (pendingApprovals as unknown as import('@prisma/client').Prisma.InputJsonValue) : undefined,
      },
    });

    return {
      sessionId: session.id,
      reply,
      agentName,
      pendingApprovals,
      toolCallsMade,
    };
  }

  async streamChat(
    teamId: string,
    userMessage: string,
    agentName: AgentName,
    sessionId: string | undefined,
    onChunk: (chunk: string) => void,
  ): Promise<ChatResponse> {
    const session = sessionId
      ? await this.getOrCreateSession(teamId, sessionId)
      : await this.createSession(teamId, userMessage);

    const deps: AgentDeps = {
      prisma: this.prisma,
      contentService: this.contentService,
      analyticsService: this.analyticsService,
      brandService: this.brandService,
      trendService: this.trendService,
      competitorService: this.competitorService,
      notificationsService: this.notificationsService,
      llm: this.llm,
      teamId,
    };

    const agent = buildAgentForTeam(agentName, deps);

    await this.prisma.agentMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: userMessage,
        agentName,
      },
    });

    let reply = '';
    const pendingApprovals: PendingApproval[] = [];
    let toolCallsMade = 0;

    try {
      const stream = agent.streamEvents(
        { messages: [new HumanMessage(userMessage)] },
        { version: 'v2' },
      );

      for await (const event of stream) {
        if (event.event === 'on_chat_model_stream') {
          const chunk =
            typeof event.data?.chunk?.content === 'string'
              ? event.data.chunk.content
              : '';
          if (chunk) {
            reply += chunk;
            onChunk(chunk);
          }
        }

        if (event.event === 'on_tool_end') {
          toolCallsMade++;
          const toolOutput =
            typeof event.data?.output === 'string'
              ? event.data.output
              : JSON.stringify(event.data?.output ?? '');
          try {
            const parsed = JSON.parse(toolOutput) as { pendingApprovals?: PendingApproval[] };
            if (parsed.pendingApprovals) {
              pendingApprovals.push(...parsed.pendingApprovals);
              onChunk(
                `\n\n[APPROVAL_REQUIRED:${JSON.stringify(parsed.pendingApprovals)}]`,
              );
            }
          } catch {
            // not JSON
          }
        }
      }
    } catch (err) {
      this.logger.error(`Stream agent [${agentName}] error:`, err);
      reply = 'Streaming error. Please try again.';
      onChunk(reply);
    }

    await this.prisma.agentMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: reply,
        agentName,
        toolCalls: pendingApprovals.length > 0 ? (pendingApprovals as unknown as import('@prisma/client').Prisma.InputJsonValue) : undefined,
      },
    });

    return { sessionId: session.id, reply, agentName, pendingApprovals, toolCallsMade };
  }

  async getSessions(teamId: string) {
    return this.prisma.agentSession.findMany({
      where: { teamId },
      include: {
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, role: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }

  async getSessionMessages(teamId: string, sessionId: string) {
    const session = await this.prisma.agentSession.findFirst({
      where: { id: sessionId, teamId },
    });
    if (!session) return null;

    const messages = await this.prisma.agentMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return { session, messages };
  }

  async getGoals(teamId: string) {
    return this.prisma.goal.findMany({
      where: { teamId, status: { not: 'deleted' } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveAction(
    teamId: string,
    sessionId: string,
    approvalId: string,
    action: 'approve' | 'reject',
  ) {
    const session = await this.prisma.agentSession.findFirst({
      where: { id: sessionId, teamId },
    });
    if (!session) return { success: false, message: 'Session not found' };

    // Find the message with this approval
    const messages = await this.prisma.agentMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const msg of messages) {
      if (!msg.toolCalls) continue;
      const approvals = msg.toolCalls as unknown as PendingApproval[];
      if (!Array.isArray(approvals)) continue;

      const approval = approvals.find(a => a.approvalId === approvalId);
      if (!approval) continue;

      if (action === 'approve') {
        await this.executeApprovedAction(teamId, approval);
      }

      return { success: true, action, approvalId, type: approval.type };
    }

    return { success: false, message: 'Approval not found' };
  }

  private async executeApprovedAction(
    teamId: string,
    approval: PendingApproval,
  ) {
    if (approval.type === 'post_draft') {
      const { postId } = approval.data as { postId: string };
      if (postId) {
        await this.prisma.post.update({
          where: { id: postId, teamId },
          data: { status: 'scheduled' },
        });
      }
    }

    if (approval.type === 'reply') {
      const { commentId, suggestedReply } = approval.data as {
        commentId: string;
        suggestedReply: string;
      };
      if (commentId && suggestedReply) {
        const parent = await this.prisma.comment.findFirst({
          where: { id: commentId, post: { teamId } },
          include: { post: { select: { id: true } } },
        });
        if (parent) {
          await this.prisma.comment.create({
            data: {
              postId: parent.post.id,
              teamId,
              content: suggestedReply,
              platform: parent.platform,
              authorId: 'agent',
              parentCommentId: commentId,
            },
          });
        }
      }
    }
  }

  private async createSession(teamId: string, firstMessage: string) {
    const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '…' : '');
    return this.prisma.agentSession.create({
      data: { teamId, title },
    });
  }

  private async getOrCreateSession(teamId: string, sessionId: string) {
    const existing = await this.prisma.agentSession.findFirst({
      where: { id: sessionId, teamId },
    });
    if (existing) return existing;
    return this.createSession(teamId, 'New session');
  }
}
