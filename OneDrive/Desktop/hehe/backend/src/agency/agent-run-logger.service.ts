import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const GROQ_COST_PER_1K_TOKENS = 0.07; // ~INR per 1K tokens for Groq Llama 3.3

@Injectable()
export class AgentRunLoggerService {
  private readonly logger = new Logger(AgentRunLoggerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    teamId: string;
    agentRole: string;
    triggerType: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
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
