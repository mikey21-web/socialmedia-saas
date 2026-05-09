import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmService } from '../../agents/llm/llm.service';
import { AgentRunLoggerService } from '../agent-run-logger.service';

interface TrainingPost {
  platform: string;
  content: string;
  engagement: number;
}

interface TrainInput {
  teamId: string;
  posts: TrainingPost[];
  brandName: string;
  brandDescription: string;
}

interface VoiceAnalysis {
  formality: number;
  energy: number;
  humor: number;
  professionalism: number;
  vocabulary: string[];
  avoidPhrases: string[];
  emojiUsage: 'frequent' | 'moderate' | 'minimal' | 'none';
  sentenceStyle: 'short' | 'medium' | 'long' | 'varied';
}

@Injectable()
export class BrandVoiceTrainerService {
  private readonly logger = new Logger(BrandVoiceTrainerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly runLogger: AgentRunLoggerService,
  ) {}

  async trainFromPosts(input: TrainInput) {
    const start = Date.now();

    const sortedPosts = [...input.posts].sort((a, b) => b.engagement - a.engagement);
    const topPosts = sortedPosts.slice(0, 20);

    const prompt = `Analyze these social media posts and extract a detailed brand voice profile.

Brand: ${input.brandName}
Description: ${input.brandDescription}

Posts (sorted by engagement, best first):
${topPosts.map((p, i) => `${i + 1}. [${p.platform}] (${p.engagement} engagement) "${p.content}"`).join('\n')}

Analyze the writing style and return JSON:
{
  "formality": 5,      // 0-10 (0=very casual, 10=very formal)
  "energy": 6,         // 0-10 (0=calm, 10=high energy)
  "humor": 3,          // 0-10 (0=serious, 10=very funny)
  "professionalism": 7,// 0-10
  "vocabulary": ["phrase1", "phrase2"],  // 10-20 common phrases/words used
  "avoidPhrases": ["avoid1", "avoid2"], // phrases never used
  "emojiUsage": "moderate", // frequent|moderate|minimal|none
  "sentenceStyle": "varied" // short|medium|long|varied
}`;

    const analysis = await this.llm.completeJson<VoiceAnalysis>(prompt, { maxTokens: 1024 });

    const brandVoice = await this.prisma.brandVoice.create({
      data: {
        teamId: input.teamId,
        name: input.brandName,
        description: input.brandDescription,
        toneAttributes: {
          formality: analysis.formality ?? 5,
          energy: analysis.energy ?? 5,
          humor: analysis.humor ?? 3,
          professionalism: analysis.professionalism ?? 7,
        },
        vocabulary: analysis.vocabulary ?? [],
        avoidPhrases: analysis.avoidPhrases ?? [],
        emojiUsage: analysis.emojiUsage ?? 'moderate',
        sentenceStyle: analysis.sentenceStyle ?? 'varied',
        trainingPosts: JSON.parse(JSON.stringify(input.posts)),
        embeddingVector: [],
        isActive: true,
      },
    });

    await this.runLogger.log({
      teamId: input.teamId,
      agentRole: 'brand_voice_trainer',
      triggerType: 'manual',
      input: { brandName: input.brandName, postCount: input.posts.length },
      output: { brandVoiceId: brandVoice.id, analysis },
      tokensUsed: 1500,
      durationMs: Date.now() - start,
      status: 'success',
    });

    return brandVoice;
  }

  async refineFromRecentPosts(brandVoiceId: string) {
    const bv = await this.prisma.brandVoice.findUniqueOrThrow({
      where: { id: brandVoiceId },
    });

    const recentPosts = await this.prisma.post.findMany({
      where: { teamId: bv.teamId, status: 'published', deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { content: true, impressions: true },
    });

    const existingTone = bv.toneAttributes as Record<string, number>;

    const prompt = `Refine this brand voice based on recent post performance.

Current voice: formality=${existingTone.formality}, energy=${existingTone.energy}, humor=${existingTone.humor}, professionalism=${existingTone.professionalism}
Current vocabulary: ${bv.vocabulary.slice(0, 10).join(', ')}

Recent posts:
${recentPosts.map(p => `- (${p.impressions} impressions) "${p.content.slice(0, 100)}"`).join('\n')}

Return the same JSON analysis format with adjusted values based on what performed best.`;

    const analysis = await this.llm.completeJson<VoiceAnalysis>(prompt, { maxTokens: 1024 });

    return this.prisma.brandVoice.update({
      where: { id: brandVoiceId },
      data: {
        toneAttributes: {
          formality: analysis.formality ?? existingTone.formality,
          energy: analysis.energy ?? existingTone.energy,
          humor: analysis.humor ?? existingTone.humor,
          professionalism: analysis.professionalism ?? existingTone.professionalism,
        },
        vocabulary: analysis.vocabulary?.length ? analysis.vocabulary : bv.vocabulary,
        avoidPhrases: analysis.avoidPhrases?.length ? analysis.avoidPhrases : bv.avoidPhrases,
        emojiUsage: analysis.emojiUsage ?? bv.emojiUsage,
        sentenceStyle: analysis.sentenceStyle ?? bv.sentenceStyle,
      },
    });
  }

  async scoreVoiceMatch(brandVoiceId: string, draftContent: string): Promise<{ score: number; feedback: string[] }> {
    const bv = await this.prisma.brandVoice.findUniqueOrThrow({
      where: { id: brandVoiceId },
    });

    const tone = bv.toneAttributes as Record<string, number>;
    const prompt = `Score how well this draft matches the brand voice (0-100).

Brand: ${bv.name}
Tone: formality=${tone.formality}/10, energy=${tone.energy}/10, humor=${tone.humor}/10, professionalism=${tone.professionalism}/10
Vocabulary: ${bv.vocabulary.slice(0, 10).join(', ')}
Emoji: ${bv.emojiUsage}, Sentence style: ${bv.sentenceStyle}

Draft: "${draftContent}"

Return JSON: { "score": 85, "feedback": ["matches energy well", "needs more industry terms"] }`;

    return this.llm.completeJson<{ score: number; feedback: string[] }>(prompt);
  }

  async listVoices(teamId: string) {
    return this.prisma.brandVoice.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateVoice(brandVoiceId: string, updates: Partial<{
    name: string;
    description: string;
    toneAttributes: Record<string, number>;
    vocabulary: string[];
    avoidPhrases: string[];
    emojiUsage: string;
    sentenceStyle: string;
    isActive: boolean;
  }>) {
    return this.prisma.brandVoice.update({
      where: { id: brandVoiceId },
      data: updates,
    });
  }
}
