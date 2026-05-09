import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LlmService } from '../../../agents/llm/llm.service';
import { AgentRunLoggerService } from '../../agent-run-logger.service';
import { HumanizerService } from '../../../ai/humanizer/humanizer.service';

interface IncomingMessageInput {
  teamId: string;
  platform: string;
  messageType: 'comment' | 'dm';
  content: string;
  fromUser: string;
  postId?: string;
}

interface IntentClassification {
  intent: 'buyer_inquiry' | 'support' | 'compliment' | 'complaint' | 'spam' | 'other';
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
}

@Injectable()
export class EngagementManagerService {
  private readonly logger = new Logger(EngagementManagerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly runLogger: AgentRunLoggerService,
    private readonly humanizer: HumanizerService,
  ) {}

  async processIncomingMessage(input: IncomingMessageInput) {
    const start = Date.now();

    const classification = await this.classifyIntent(input.content);

    const team = await this.prisma.team.findUnique({
      where: { id: input.teamId },
      select: { agencyTier: true },
    });

    const brandVoice = await this.prisma.brandVoice.findFirst({
      where: { teamId: input.teamId, isActive: true },
    });

    const rawResponse = await this.generateResponse({
      brandVoiceId: brandVoice?.id,
      incomingMessage: input.content,
      intent: classification.intent,
      fromUser: input.fromUser,
      platform: input.platform,
    });
    const humanizedResponse = await this.humanizer.humanize(rawResponse, {
      platform: input.platform,
    });
    const response = humanizedResponse.humanized;

    const shouldAutoSend = this.shouldAutoSend(
      team?.agencyTier ?? 'solo',
      classification,
    );

    const action = await this.prisma.engagementAction.create({
      data: {
        teamId: input.teamId,
        platform: input.platform,
        postId: input.postId,
        commentId: null,
        dmThreadId: input.messageType === 'dm' ? `dm_${input.fromUser}` : null,
        actionType: input.messageType === 'comment' ? 'comment_reply' : 'dm_reply',
        triggerContent: input.content,
        agentResponse: response,
        sentiment: classification.sentiment,
        intent: classification.intent,
        status: shouldAutoSend ? 'sent' : 'pending',
        brandVoiceId: brandVoice?.id,
      },
    });

    await this.runLogger.log({
      teamId: input.teamId,
      agentRole: 'engagement_manager',
      triggerType: 'engagement',
      input: input as unknown as Record<string, unknown>,
      output: {
        actionId: action.id,
        classification,
        autoSent: shouldAutoSend,
        aiScore: humanizedResponse.aiScore,
        finalAiScore: humanizedResponse.finalAiScore,
      },
      tokensUsed: 800,
      durationMs: Date.now() - start,
      status: 'success',
    });

    return action;
  }

  private async classifyIntent(content: string): Promise<IntentClassification> {
    const prompt = `Classify this social media message.

Message: "${content}"

Return JSON:
{
  "intent": "buyer_inquiry" | "support" | "compliment" | "complaint" | "spam" | "other",
  "sentiment": "positive" | "neutral" | "negative",
  "urgency": "low" | "medium" | "high"
}`;

    return this.llm.completeJson<IntentClassification>(prompt, { maxTokens: 256 });
  }

  private async generateResponse(input: {
    brandVoiceId?: string;
    incomingMessage: string;
    intent: string;
    fromUser: string;
    platform: string;
  }): Promise<string> {
    let voiceContext = 'Respond in a friendly, professional tone.';

    if (input.brandVoiceId) {
      const bv = await this.prisma.brandVoice.findUnique({
        where: { id: input.brandVoiceId },
      });
      if (bv) {
        const tone = bv.toneAttributes as Record<string, number>;
        voiceContext = `Brand: ${bv.name}. Formality: ${tone.formality ?? 5}/10. Energy: ${tone.energy ?? 5}/10. Emoji: ${bv.emojiUsage}. Style: ${bv.sentenceStyle}.`;
      }
    }

    const intentGuidelines: Record<string, string> = {
      buyer_inquiry: 'Be helpful and guide toward purchase. Include a subtle CTA.',
      support: 'Be empathetic and solution-oriented. Offer to help via DM if complex.',
      compliment: 'Thank them warmly. Ask if they would share their experience.',
      complaint: 'Apologize sincerely. Offer to resolve the issue privately.',
      spam: 'Politely redirect or ignore.',
      other: 'Respond appropriately based on context.',
    };

    const prompt = `Generate a ${input.platform} reply to this message from @${input.fromUser}.

${voiceContext}
Intent: ${input.intent}. ${intentGuidelines[input.intent] ?? ''}

Their message: "${input.incomingMessage}"

Reply (just the text, no JSON):`;

    return this.llm.complete(prompt, { maxTokens: 256 });
  }

  private shouldAutoSend(tier: string, classification: IntentClassification): boolean {
    if (tier === 'solo') return false;
    if (classification.sentiment === 'negative') return false;
    if (classification.intent === 'complaint') return false;
    if (classification.urgency === 'high') return false;
    if (classification.intent === 'spam') return false;
    if (tier === 'pro' || tier === 'agency' || tier === 'enterprise') {
      return classification.sentiment === 'positive' && classification.urgency === 'low';
    }
    return false;
  }

  async processBacklog(teamId: string) {
    const pending = await this.prisma.engagementAction.findMany({
      where: { teamId, status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    return { processed: pending.length, actions: pending };
  }

  async approveAction(actionId: string, userId: string) {
    return this.prisma.engagementAction.update({
      where: { id: actionId },
      data: { status: 'approved', approvedBy: userId },
    });
  }

  async rejectAction(actionId: string) {
    return this.prisma.engagementAction.update({
      where: { id: actionId },
      data: { status: 'rejected' },
    });
  }

  async listActions(teamId: string, status?: string) {
    return this.prisma.engagementAction.findMany({
      where: { teamId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
