import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const GROQ_COST_PER_1K_TOKENS = 0.07; // ~INR per 1K tokens for Groq Llama 3.3

@Injectable()
export class AgentRunLoggerService {
  private readonly logger = new Logger(AgentRunLoggerService.name);
  private readonly activeRuns = new Map<string, {
    teamId: string;
    agentRole: string;
    triggerType: string;
    input: unknown;
    startedAt: number;
  }>();

  constructor(private readonly prisma: PrismaService) {}

  async start(
    teamId: string,
    agentRole: string,
    runId: string,
    triggerType: string,
    input: unknown,
  ) {
    this.activeRuns.set(runId, {
      teamId,
      agentRole,
      triggerType,
      input,
      startedAt: Date.now(),
    });
  }

  async succeed(runId: string, output: Record<string, unknown>) {
    const run = this.activeRuns.get(runId);
    if (!run) return;
    this.activeRuns.delete(runId);
    await this.log({
      teamId: run.teamId,
      agentRole: run.agentRole,
      triggerType: run.triggerType,
      input: run.input,
      output,
      tokensUsed: 0,
      durationMs: Date.now() - run.startedAt,
      status: 'success',
    });
  }

  async fail(runId: string, errorMessage: string) {
    const run = this.activeRuns.get(runId);
    if (!run) return;
    this.activeRuns.delete(runId);
    await this.log({
      teamId: run.teamId,
      agentRole: run.agentRole,
      triggerType: run.triggerType,
      input: run.input,
      output: {},
      tokensUsed: 0,
      durationMs: Date.now() - run.startedAt,
      status: 'failed',
      errorMessage,
    });
  }

  async log(params: {
    teamId: string;
    agentRole: string;
    triggerType: string;
    input: unknown;
    output: unknown;
    tokensUsed: number;
    durationMs: number;
    status: 'success' | 'failed';
    errorMessage?: string;
  }) {
    const costInr = (params.tokensUsed / 1000) * GROQ_COST_PER_1K_TOKENS;

    try {
      await this.prisma.agentRunLog.create({
        data: {
          teamId: params.teamId,
          agentRole: params.agentRole,
          triggerType: params.triggerType,
          input: JSON.parse(JSON.stringify(params.input)),
          output: JSON.parse(JSON.stringify(params.output)),
          tokensUsed: params.tokensUsed,
          costInr,
          durationMs: params.durationMs,
          status: params.status,
          errorMessage: params.errorMessage,
        },
      });
    } catch (err) {
      this.logger.error('Failed to log agent run', err);
    }
  }
}
