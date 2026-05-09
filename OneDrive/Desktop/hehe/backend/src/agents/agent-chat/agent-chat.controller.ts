import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AgentChatService } from './agent-chat.service';
import { AgentName } from './agent.graph';

interface AuthRequest extends Request {
  user: { teamId: string; team_id: string };
}

@UseGuards(JwtAuthGuard)
@Controller('agent-chat')
export class AgentChatController {
  constructor(private readonly agentChatService: AgentChatService) {}

  /** POST /agent-chat/message — non-streaming single-turn */
  @Post('message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Req() req: AuthRequest,
    @Body()
    body: {
      message: string;
      agent: AgentName;
      sessionId?: string;
    },
  ) {
    const teamId = req.user.team_id;
    return this.agentChatService.chat(
      teamId,
      body.message,
      body.agent,
      body.sessionId,
    );
  }

  /** GET /agent-chat/stream?message=...&agent=...&sessionId=... — SSE streaming */
  @Get('stream')
  async streamMessage(
    @Req() req: AuthRequest,
    @Res() res: Response,
    @Query('message') message: string,
    @Query('agent') agent: AgentName,
    @Query('sessionId') sessionId?: string,
  ) {
    const teamId = req.user.team_id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data: unknown) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const result = await this.agentChatService.streamChat(
        teamId,
        message,
        agent,
        sessionId,
        (chunk: string) => {
          // Parse out embedded APPROVAL_REQUIRED markers
          const approvalMatch = chunk.match(/\[APPROVAL_REQUIRED:(.+?)\]$/);
          if (approvalMatch) {
            try {
              const approvals = JSON.parse(approvalMatch[1]) as unknown[];
              send({ type: 'approvals', data: approvals });
            } catch {
              // skip
            }
          } else {
            send({ type: 'chunk', content: chunk });
          }
        },
      );

      send({
        type: 'done',
        sessionId: result.sessionId,
        toolCallsMade: result.toolCallsMade,
        pendingApprovals: result.pendingApprovals,
      });
    } catch (err) {
      send({ type: 'error', message: String(err) });
    }

    res.end();
  }

  /** GET /agent-chat/sessions */
  @Get('sessions')
  async getSessions(@Req() req: AuthRequest) {
    const teamId = req.user.team_id;
    return this.agentChatService.getSessions(teamId);
  }

  /** GET /agent-chat/sessions/:sessionId */
  @Get('sessions/:sessionId')
  async getSession(
    @Req() req: AuthRequest,
    @Param('sessionId') sessionId: string,
  ) {
    const teamId = req.user.team_id;
    return this.agentChatService.getSessionMessages(teamId, sessionId);
  }

  /** GET /agent-chat/goals */
  @Get('goals')
  async getGoals(@Req() req: AuthRequest) {
    const teamId = req.user.team_id;
    return this.agentChatService.getGoals(teamId);
  }

  /** POST /agent-chat/sessions/:sessionId/approve/:approvalId */
  @Post('sessions/:sessionId/approve/:approvalId')
  @HttpCode(HttpStatus.OK)
  async approveAction(
    @Req() req: AuthRequest,
    @Param('sessionId') sessionId: string,
    @Param('approvalId') approvalId: string,
    @Body() body: { action: 'approve' | 'reject' },
  ) {
    const teamId = req.user.team_id;
    return this.agentChatService.approveAction(
      teamId,
      sessionId,
      approvalId,
      body.action,
    );
  }
}
