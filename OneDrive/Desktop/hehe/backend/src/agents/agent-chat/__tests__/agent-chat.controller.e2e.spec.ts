import { INestApplication, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../../../auth/jwt.guard';
import { AgentChatService } from '../agent-chat.service';
import { AgentChatController } from '../agent-chat.controller';

jest.setTimeout(10000);

const testUser = {
  sub: 'test-user',
  team_id: 'team-abc',
  email: 'test@test.com',
};

const mockJwtAuthGuard: CanActivate = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    req.user = testUser;
    return true;
  },
};

const mockThrottlerGuard: CanActivate = {
  canActivate: () => true,
};

const mockAgentChatService = {
  chat: jest.fn(),
  streamChat: jest.fn(),
  getSessions: jest.fn(),
  getSessionMessages: jest.fn(),
  getGoals: jest.fn(),
  approveAction: jest.fn(),
};

describe('AgentChatController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockAgentChatService.chat.mockResolvedValue({
      sessionId: 'session-1',
      reply: 'Hello from agent',
      agentName: 'content',
      pendingApprovals: [],
      toolCallsMade: 0,
    });
    mockAgentChatService.streamChat.mockImplementation(
      async (
        _teamId: string,
        _message: string,
        agent: string,
        sessionId: string | undefined,
        onChunk: (chunk: string) => void,
      ) => {
        onChunk('Hello');
        return {
          sessionId: sessionId ?? 'session-stream',
          reply: 'Hello',
          agentName: agent,
          pendingApprovals: [],
          toolCallsMade: 0,
        };
      },
    );
    mockAgentChatService.getSessions.mockResolvedValue([
      { id: 'session-1', title: 'First session' },
    ]);
    mockAgentChatService.getSessionMessages.mockResolvedValue({
      session: { id: 'session-1', teamId: 'team-abc' },
      messages: [{ id: 'message-1', role: 'user', content: 'Hi' }],
    });
    mockAgentChatService.getGoals.mockResolvedValue([
      { id: 'goal-1', title: 'Grow reach' },
    ]);
    mockAgentChatService.approveAction.mockResolvedValue({
      success: true,
      action: 'approve',
      approvalId: 'approval-1',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AgentChatController],
      providers: [
        { provide: AgentChatService, useValue: mockAgentChatService },
        { provide: JwtAuthGuard, useValue: { canActivate: () => { throw new UnauthorizedException(); } } },
        { provide: APP_GUARD, useValue: mockThrottlerGuard },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /agent-chat/message', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns 200 with sessionId, reply, agentName, pendingApprovals, toolCallsMade', async () => {
      const response = await request(app.getHttpServer())
        .post('/agent-chat/message')
        .send({ message: 'Write a post', agent: 'content' })
        .expect(200);

      expect(response.body).toEqual({
        sessionId: 'session-1',
        reply: 'Hello from agent',
        agentName: 'content',
        pendingApprovals: [],
        toolCallsMade: 0,
      });
    });

    it('passes teamId from JWT to service', async () => {
      await request(app.getHttpServer())
        .post('/agent-chat/message')
        .send({ message: 'Write a post', agent: 'content' })
        .expect(200);

      expect(mockAgentChatService.chat).toHaveBeenCalledWith(
        'team-abc',
        expect.any(String),
        expect.any(String),
        undefined,
      );
    });

    it('passes message, agent, sessionId to service', async () => {
      await request(app.getHttpServer())
        .post('/agent-chat/message')
        .send({
          message: 'Continue this',
          agent: 'strategy',
          sessionId: 'session-existing',
        })
        .expect(200);

      expect(mockAgentChatService.chat).toHaveBeenCalledWith(
        'team-abc',
        'Continue this',
        'strategy',
        'session-existing',
      );
    });
  });

  describe('GET /agent-chat/stream', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns SSE content-type header', async () => {
      const response = await request(app.getHttpServer())
        .get('/agent-chat/stream')
        .query({ message: 'Stream please', agent: 'content' })
        .timeout(3000)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
    });

    it('emits at least one "data:" line', async () => {
      const response = await request(app.getHttpServer())
        .get('/agent-chat/stream')
        .query({ message: 'Stream please', agent: 'content' })
        .timeout(3000)
        .expect(200);

      expect(response.text.split('\n').some(line => line.startsWith('data:'))).toBe(
        true,
      );
    });

    it('emits { type: "done" } event as last event', async () => {
      const response = await request(app.getHttpServer())
        .get('/agent-chat/stream')
        .query({ message: 'Stream please', agent: 'content' })
        .timeout(3000)
        .expect(200);

      const events = response.text
        .trim()
        .split('\n\n')
        .map(line => JSON.parse(line.replace(/^data: /, '')));
      expect(events[events.length - 1]).toMatchObject({ type: 'done' });
    });
  });

  describe('GET /agent-chat/sessions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns 200 with array', async () => {
      const response = await request(app.getHttpServer())
        .get('/agent-chat/sessions')
        .expect(200);

      expect(response.body).toEqual([{ id: 'session-1', title: 'First session' }]);
    });

    it('calls getSessions with teamId', async () => {
      await request(app.getHttpServer()).get('/agent-chat/sessions').expect(200);

      expect(mockAgentChatService.getSessions).toHaveBeenCalledWith('team-abc');
    });
  });

  describe('GET /agent-chat/sessions/:sessionId', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns 200 with session + messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/agent-chat/sessions/session-1')
        .expect(200);

      expect(response.body).toEqual({
        session: { id: 'session-1', teamId: 'team-abc' },
        messages: [{ id: 'message-1', role: 'user', content: 'Hi' }],
      });
    });

    it('returns null when session not found', async () => {
      mockAgentChatService.getSessionMessages.mockResolvedValueOnce(null);

      const response = await request(app.getHttpServer())
        .get('/agent-chat/sessions/missing')
        .expect(200);

      expect(response.body).toEqual({});
    });
  });

  describe('GET /agent-chat/goals', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns 200 with array', async () => {
      const response = await request(app.getHttpServer())
        .get('/agent-chat/goals')
        .expect(200);

      expect(response.body).toEqual([{ id: 'goal-1', title: 'Grow reach' }]);
    });
  });

  describe('POST /agent-chat/sessions/:sessionId/approve/:approvalId', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns 200 with { success, action, approvalId }', async () => {
      const response = await request(app.getHttpServer())
        .post('/agent-chat/sessions/session-1/approve/approval-1')
        .send({ action: 'approve' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        action: 'approve',
        approvalId: 'approval-1',
      });
    });

    it('passes "approve" action correctly', async () => {
      await request(app.getHttpServer())
        .post('/agent-chat/sessions/session-1/approve/approval-1')
        .send({ action: 'approve' })
        .expect(200);

      expect(mockAgentChatService.approveAction).toHaveBeenCalledWith(
        'team-abc',
        'session-1',
        'approval-1',
        'approve',
      );
    });

    it('passes "reject" action correctly', async () => {
      mockAgentChatService.approveAction.mockResolvedValueOnce({
        success: true,
        action: 'reject',
        approvalId: 'approval-1',
      });

      await request(app.getHttpServer())
        .post('/agent-chat/sessions/session-1/approve/approval-1')
        .send({ action: 'reject' })
        .expect(200);

      expect(mockAgentChatService.approveAction).toHaveBeenCalledWith(
        'team-abc',
        'session-1',
        'approval-1',
        'reject',
      );
    });
  });
});

describe('AgentChatController real JWT guard (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture = await Test.createTestingModule({
      controllers: [AgentChatController],
      providers: [
        { provide: AgentChatService, useValue: mockAgentChatService },
        JwtAuthGuard,
        { provide: APP_GUARD, useValue: mockThrottlerGuard },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => { throw new UnauthorizedException(); } })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 when JWT guard fails', async () => {
    await request(app.getHttpServer())
      .post('/agent-chat/message')
      .send({ message: 'Write a post', agent: 'content' })
      .expect(401);
  });
});
