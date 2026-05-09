import { AgentChatService } from '../agent-chat.service';
import { buildAgentForTeam } from '../agent.graph';

jest.mock('../agent.graph', () => ({
  buildAgentForTeam: jest.fn().mockReturnValue({
    invoke: jest.fn().mockResolvedValue({
      messages: [{ content: 'Mock agent reply', _getType: () => 'ai' }],
    }),
    streamEvents: jest.fn().mockImplementation(async function* () {
      yield {
        event: 'on_chat_model_stream',
        data: { chunk: { content: 'Hello' } },
      };
      yield {
        event: 'on_chat_model_stream',
        data: { chunk: { content: ' world' } },
      };
    }),
  }),
}));

const mockPrisma = {
  agentSession: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  agentMessage: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  goal: {
    findMany: jest.fn(),
  },
  post: {
    update: jest.fn(),
  },
  comment: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

const mockDeps = {
  contentService: {},
  analyticsService: {},
  brandService: {},
  trendService: {},
  competitorService: {},
  notificationsService: {},
  llm: {},
};

const session = {
  id: 'session-1',
  teamId: 'team-abc',
  title: 'Session',
};

const approval = {
  approvalId: 'approval-1',
  type: 'post_draft' as const,
  data: { postId: 'post-1' },
};

describe('AgentChatService', () => {
  let service: AgentChatService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma.agentSession.create.mockResolvedValue(session);
    mockPrisma.agentSession.findFirst.mockResolvedValue(session);
    mockPrisma.agentSession.findMany.mockResolvedValue([session]);
    mockPrisma.agentMessage.findMany.mockResolvedValue([]);
    mockPrisma.agentMessage.create.mockResolvedValue({ id: 'message-1' });
    mockPrisma.goal.findMany.mockResolvedValue([{ id: 'goal-1' }]);
    mockPrisma.post.update.mockResolvedValue({ id: 'post-1', status: 'scheduled' });
    mockPrisma.comment.findFirst.mockResolvedValue({
      id: 'comment-1',
      platform: 'linkedin',
      post: { id: 'post-1' },
    });
    mockPrisma.comment.create.mockResolvedValue({ id: 'reply-1' });
    (buildAgentForTeam as jest.Mock).mockReturnValue({
      invoke: jest.fn().mockResolvedValue({
        messages: [{ content: 'Mock agent reply', _getType: () => 'ai' }],
      }),
      streamEvents: jest.fn().mockImplementation(async function* () {
        yield {
          event: 'on_chat_model_stream',
          data: { chunk: { content: 'Hello' } },
        };
        yield {
          event: 'on_chat_model_stream',
          data: { chunk: { content: ' world' } },
        };
      }),
    });

    service = new AgentChatService(
      mockPrisma as never,
      mockDeps.contentService as never,
      mockDeps.analyticsService as never,
      mockDeps.brandService as never,
      mockDeps.trendService as never,
      mockDeps.competitorService as never,
      mockDeps.notificationsService as never,
      mockDeps.llm as never,
    );
    jest.spyOn(service['logger'], 'error').mockImplementation(() => undefined);
  });

  describe('chat()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('creates new session when sessionId not provided', async () => {
      await service.chat('team-abc', 'New chat', 'content');

      expect(mockPrisma.agentSession.create).toHaveBeenCalledWith({
        data: { teamId: 'team-abc', title: 'New chat' },
      });
    });

    it('reuses existing session when sessionId provided', async () => {
      await service.chat('team-abc', 'Continue', 'content', 'session-1');

      expect(mockPrisma.agentSession.findFirst).toHaveBeenCalledWith({
        where: { id: 'session-1', teamId: 'team-abc' },
      });
      expect(mockPrisma.agentSession.create).not.toHaveBeenCalled();
    });

    it('saves user message to DB before invoking agent', async () => {
      const invoke = jest.fn().mockResolvedValue({
        messages: [{ content: 'Reply', _getType: () => 'ai' }],
      });
      (buildAgentForTeam as jest.Mock).mockReturnValue({ invoke });

      await service.chat('team-abc', 'Hello', 'content');

      const userCreateOrder = mockPrisma.agentMessage.create.mock.invocationCallOrder[0];
      const invokeOrder = invoke.mock.invocationCallOrder[0];
      expect(userCreateOrder).toBeLessThan(invokeOrder);
      expect(mockPrisma.agentMessage.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session-1',
          role: 'user',
          content: 'Hello',
          agentName: 'content',
        },
      });
    });

    it('saves assistant reply to DB after agent returns', async () => {
      await service.chat('team-abc', 'Hello', 'content');

      expect(mockPrisma.agentMessage.create).toHaveBeenLastCalledWith({
        data: {
          sessionId: 'session-1',
          role: 'assistant',
          content: 'Mock agent reply',
          agentName: 'content',
          toolCalls: undefined,
        },
      });
    });

    it('returns { sessionId, reply, agentName, pendingApprovals, toolCallsMade }', async () => {
      const result = await service.chat('team-abc', 'Hello', 'content');

      expect(result).toEqual({
        sessionId: 'session-1',
        reply: 'Mock agent reply',
        agentName: 'content',
        pendingApprovals: [],
        toolCallsMade: 0,
      });
    });

    it('extracts pendingApprovals from tool messages', async () => {
      (buildAgentForTeam as jest.Mock).mockReturnValue({
        invoke: jest.fn().mockResolvedValue({
          messages: [
            {
              content: JSON.stringify({ pendingApprovals: [approval] }),
              _getType: () => 'tool',
            },
            { content: 'Done', _getType: () => 'ai' },
          ],
        }),
      });

      const result = await service.chat('team-abc', 'Hello', 'content');

      expect(result.pendingApprovals).toEqual([approval]);
    });

    it('returns error reply string on agent exception (does not throw)', async () => {
      (buildAgentForTeam as jest.Mock).mockReturnValue({
        invoke: jest.fn().mockRejectedValue(new Error('LLM failed')),
      });

      await expect(service.chat('team-abc', 'Hello', 'content')).resolves.toMatchObject({
        reply:
          'I encountered an error while processing your request. Please try again or rephrase your question.',
      });
    });

    it('counts toolCallsMade correctly from tool messages', async () => {
      (buildAgentForTeam as jest.Mock).mockReturnValue({
        invoke: jest.fn().mockResolvedValue({
          messages: [
            { content: '{}', _getType: () => 'tool' },
            { content: 'not json', _getType: () => 'tool' },
            { content: 'Done', _getType: () => 'ai' },
          ],
        }),
      });

      const result = await service.chat('team-abc', 'Hello', 'content');

      expect(result.toolCallsMade).toBe(2);
    });
  });

  describe('streamChat()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('calls onChunk for each stream chunk', async () => {
      const onChunk = jest.fn();

      await service.streamChat('team-abc', 'Hello', 'content', undefined, onChunk);

      expect(onChunk).toHaveBeenCalledWith('Hello');
      expect(onChunk).toHaveBeenCalledWith(' world');
    });

    it('parses APPROVAL_REQUIRED markers and adds to pendingApprovals', async () => {
      (buildAgentForTeam as jest.Mock).mockReturnValue({
        streamEvents: jest.fn().mockImplementation(async function* () {
          yield {
            event: 'on_tool_end',
            data: { output: JSON.stringify({ pendingApprovals: [approval] }) },
          };
        }),
      });
      const onChunk = jest.fn();

      const result = await service.streamChat(
        'team-abc',
        'Hello',
        'content',
        undefined,
        onChunk,
      );

      expect(result.pendingApprovals).toEqual([approval]);
      expect(onChunk).toHaveBeenCalledWith(
        `\n\n[APPROVAL_REQUIRED:${JSON.stringify([approval])}]`,
      );
    });

    it('saves assistant message after stream completes', async () => {
      await service.streamChat('team-abc', 'Hello', 'content', undefined, jest.fn());

      expect(mockPrisma.agentMessage.create).toHaveBeenLastCalledWith({
        data: {
          sessionId: 'session-1',
          role: 'assistant',
          content: 'Hello world',
          agentName: 'content',
          toolCalls: undefined,
        },
      });
    });
  });

  describe('getSessions()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('queries prisma with teamId and returns results', async () => {
      const result = await service.getSessions('team-abc');

      expect(mockPrisma.agentSession.findMany).toHaveBeenCalledWith({
        where: { teamId: 'team-abc' },
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
      expect(result).toEqual([session]);
    });
  });

  describe('getSessionMessages()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns null when session not found', async () => {
      mockPrisma.agentSession.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.getSessionMessages('team-abc', 'missing'),
      ).resolves.toBeNull();
    });

    it('returns { session, messages } when found', async () => {
      const messages = [{ id: 'message-1', content: 'Hello' }];
      mockPrisma.agentMessage.findMany.mockResolvedValueOnce(messages);

      await expect(
        service.getSessionMessages('team-abc', 'session-1'),
      ).resolves.toEqual({ session, messages });
    });
  });

  describe('getGoals()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("filters by teamId and status != 'deleted'", async () => {
      await service.getGoals('team-abc');

      expect(mockPrisma.goal.findMany).toHaveBeenCalledWith({
        where: { teamId: 'team-abc', status: { not: 'deleted' } },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('approveAction()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns { success: false } when session not found', async () => {
      mockPrisma.agentSession.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.approveAction('team-abc', 'missing', 'approval-1', 'approve'),
      ).resolves.toMatchObject({ success: false });
    });

    it('returns { success: false } when approvalId not in any message', async () => {
      mockPrisma.agentMessage.findMany.mockResolvedValueOnce([
        { id: 'message-1', toolCalls: [approval] },
      ]);

      await expect(
        service.approveAction('team-abc', 'session-1', 'missing', 'approve'),
      ).resolves.toMatchObject({ success: false });
    });

    it("calls executeApprovedAction with correct approval on 'approve'", async () => {
      mockPrisma.agentMessage.findMany.mockResolvedValueOnce([
        { id: 'message-1', toolCalls: [approval] },
      ]);
      const executeSpy = jest
        .spyOn(service as unknown as { executeApprovedAction: jest.Mock }, 'executeApprovedAction')
        .mockResolvedValue(undefined);

      await service.approveAction('team-abc', 'session-1', 'approval-1', 'approve');

      expect(executeSpy).toHaveBeenCalledWith('team-abc', approval);
    });

    it("skips executeApprovedAction on 'reject'", async () => {
      mockPrisma.agentMessage.findMany.mockResolvedValueOnce([
        { id: 'message-1', toolCalls: [approval] },
      ]);
      const executeSpy = jest
        .spyOn(service as unknown as { executeApprovedAction: jest.Mock }, 'executeApprovedAction')
        .mockResolvedValue(undefined);

      await service.approveAction('team-abc', 'session-1', 'approval-1', 'reject');

      expect(executeSpy).not.toHaveBeenCalled();
    });

    it("updates post to 'scheduled' for post_draft approval type", async () => {
      mockPrisma.agentMessage.findMany.mockResolvedValueOnce([
        { id: 'message-1', toolCalls: [approval] },
      ]);

      await service.approveAction('team-abc', 'session-1', 'approval-1', 'approve');

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1', teamId: 'team-abc' },
        data: { status: 'scheduled' },
      });
    });

    it('creates reply comment for reply approval type', async () => {
      const replyApproval = {
        approvalId: 'approval-reply',
        type: 'reply' as const,
        data: { commentId: 'comment-1', suggestedReply: 'Thanks!' },
      };
      mockPrisma.agentMessage.findMany.mockResolvedValueOnce([
        { id: 'message-1', toolCalls: [replyApproval] },
      ]);

      await service.approveAction(
        'team-abc',
        'session-1',
        'approval-reply',
        'approve',
      );

      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          postId: 'post-1',
          teamId: 'team-abc',
          content: 'Thanks!',
          platform: 'linkedin',
          authorId: 'agent',
          parentCommentId: 'comment-1',
        },
      });
    });
  });
});
