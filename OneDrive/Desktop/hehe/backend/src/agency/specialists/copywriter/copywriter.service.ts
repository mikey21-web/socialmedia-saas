import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LlmService } from '../../../agents/llm/llm.service';
import { AgentRunLoggerService } from '../../agent-run-logger.service';
import { HumanizerService } from '../../../ai/humanizer/humanizer.service';
import { Detection } from '../../../ai/humanizer/types';
import { DesignerService } from '../designer/designer.service';

interface GeneratePostInput {
  teamId: string;
  brandVoiceId: string;
  platform: string;
  pillarTopic: string;
  contentType: 'educational' | 'promotional' | 'trending' | 'ugc' | 'behind_scenes';
  referenceUrl?: string;
  trendSignalId?: string;
  targetWordCount?: number;
}

export interface PostOutput {
  content: string;
  hashtags: string[];
  cta?: string;
  imagePrompt?: string;
  style?: string;
  aspectRatio?: string;
  voiceMatchScore?: number;
  voiceFeedback?: string[];
  aiScore?: number;
  finalAiScore?: number;
  humanizerDetections?: Detection[];
}

@Injectable()
export class CopywriterService {
  private readonly logger = new Logger(CopywriterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly runLogger: AgentRunLoggerService,
    private readonly humanizer: HumanizerService,
    private readonly designerService: DesignerService,
  ) {}

  async generatePost(input: GeneratePostInput): Promise<PostOutput> {
    const start = Date.now();

    const brandVoice = await this.prisma.brandVoice.findUnique({
      where: { id: input.brandVoiceId },
    });

    if (!brandVoice) {
      throw new Error('Brand voice not found');
    }

    const tone = brandVoice.toneAttributes as Record<string, number>;
    const trainingPosts = brandVoice.trainingPosts as Array<{
      platform: string;
      content: string;
      engagement: number;
    }>;

    const topExamples = trainingPosts
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5)
      .map(p => `[${p.platform}] ${p.content}`)
      .join('\n\n');

    let trendContext = '';
    if (input.trendSignalId) {
      const signal = await this.prisma.trendSignal.findUnique({
        where: { id: input.trendSignalId },
      });
      if (signal) {
        trendContext = `\nTrending now: ${signal.value} (${signal.signalType} on ${signal.platform}, popularity: ${signal.popularity})`;
      }
    }

    const prompt = `You are writing as ${brandVoice.name}. Brand voice attributes:
- Tone: formality ${tone.formality ?? 5}/10, energy ${tone.energy ?? 5}/10, humor ${tone.humor ?? 3}/10, professionalism ${tone.professionalism ?? 7}/10
- Common phrases: ${brandVoice.vocabulary.join(', ')}
- Avoid: ${brandVoice.avoidPhrases.join(', ')}
- Emoji usage: ${brandVoice.emojiUsage}
- Sentence style: ${brandVoice.sentenceStyle}

Reference posts that performed well:
${topExamples}
${trendContext}

Write a ${input.platform} post about "${input.pillarTopic}" (type: ${input.contentType}).
Target length: ${input.targetWordCount ?? 150} words.
${input.referenceUrl ? `Reference: ${input.referenceUrl}` : ''}

Match the voice EXACTLY. Return JSON:
{
  "content": "the post text",
  "hashtags": ["#tag1", "#tag2"],
  "cta": "call to action or null",
  "imagePrompt": "description for AI image generation",
  "style": "photo|illustration|graphic|meme",
  "aspectRatio": "1:1|9:16|16:9|4:5"
}`;

    let result: PostOutput | undefined;

    for (let attempt = 0; attempt < 3; attempt++) {
      const generated = await this.llm.completeJson<PostOutput>(prompt, { maxTokens: 1024 });
      const humanized = await this.humanizer.humanize(generated.content, {
        platform: input.platform,
        toneDimensions: tone,
      });
      const voiceMatch = await this.scoreVoiceMatch(input.brandVoiceId, humanized.humanized);

      result = {
        ...generated,
        content: humanized.humanized,
        voiceMatchScore: voiceMatch.score,
        voiceFeedback: voiceMatch.feedback,
        aiScore: humanized.aiScore,
        finalAiScore: humanized.finalAiScore,
        humanizerDetections: humanized.detections,
      };

      if (voiceMatch.score >= 70 && humanized.finalAiScore <= 30) {
        break;
      }
    }

    if (!result) {
      throw new Error('Post generation failed');
    }

    await this.runLogger.log({
      teamId: input.teamId,
      agentRole: 'copywriter',
      triggerType: 'manual',
      input: input as unknown as Record<string, unknown>,
      output: result as unknown as Record<string, unknown>,
      tokensUsed: 1200,
      durationMs: Date.now() - start,
      status: 'success',
    });

    return result;
  }

  async generateVariants(input: GeneratePostInput, count: number): Promise<PostOutput[]> {
    const results: PostOutput[] = [];
    for (let i = 0; i < count; i++) {
      const variant = await this.generatePost({
        ...input,
        targetWordCount: (input.targetWordCount ?? 150) + (i * 10 - 10),
      });
      results.push(variant);
    }
    return results;
  }

  async crossPlatformAdapt(input: {
    teamId: string;
    sourceContent: string;
    sourcePlatform: string;
    targetPlatforms: string[];
    brandVoiceId: string;
  }): Promise<Record<string, string>> {
    const brandVoice = await this.prisma.brandVoice.findUnique({
      where: { id: input.brandVoiceId },
    });

    const platformLimits: Record<string, string> = {
      x: '280 characters, punchy, 1-3 hashtags',
      instagram: '2200 chars, story-driven, 15-25 hashtags in comment',
      linkedin: '3000 chars, professional tone, 3-5 hashtags',
      facebook: '500-1000 chars, conversational, 2-3 hashtags',
      tiktok: '150 chars, trendy, 3-8 hashtags',
    };

    const prompt = `Adapt this ${input.sourcePlatform} post to other platforms.

Original: "${input.sourceContent}"
Brand voice: ${brandVoice?.name ?? 'default'}

Target platforms and their guidelines:
${input.targetPlatforms.map(p => `- ${p}: ${platformLimits[p] ?? 'standard post'}`).join('\n')}

Return JSON with each platform as key and adapted content as value:
{ "instagram": "...", "x": "..." }`;

    const result = await this.llm.completeJson<Record<string, string>>(prompt, { maxTokens: 2048 });
    const adapted: Record<string, string> = {};

    for (const platform of input.targetPlatforms) {
      const content = result[platform];
      if (!content) continue;

      const humanized = await this.humanizer.humanize(content, { platform });
      adapted[platform] = humanized.humanized;
    }

    return adapted;
  }

  async generateFullPost(teamId: string, brief: any): Promise<any> {
    // 1. Generate copy
    // Need to cast to GeneratePostInput
    const copyResult = await this.generatePost({
      teamId,
      ...brief
    } as any);

    const variants = [copyResult]; // Mocking the array structure expected by the prompt code
    
    // 2. Auto-generate design brief from copy
    const designBrief = {
      teamId,
      subject: this.extractVisualSubject(brief.topic || brief.pillarTopic, copyResult.content),
      style: this.getStyleForVertical(brief.vertical || 'generic'),
      mood: this.getMoodFromTone(copyResult.voiceMatchScore || 50),
      platform: brief.platforms || [brief.platform],
      imageType: 'post' as const,
      quality: 'draft' as const,  // fast for content pipeline
    };

    // 3. Generate image (non-blocking background job)
    this.designerService.generateImage(designBrief)
      .then(img => this.saveImageToPost(brief.postId, img))
      .catch(err => console.error('Image generation failed:', err));

    return {
      copy: { variants },
      imageGenerationStarted: true,
    };
  }

  private getStyleForVertical(vertical: string): string {
    const styles: Record<string, string> = {
      salon: 'clean salon photography, bright lighting, professional beauty',
      restaurant: 'food photography, warm lighting, appetizing presentation',
      real_estate: 'architectural photography, bright interiors, aspirational',
      gym: 'fitness photography, energetic, motion, determination',
      clinic: 'clean medical environment, trust, professional care',
      coach: 'professional portrait, confidence, achievement',
      generic: 'clean professional photography, modern, polished',
    };
    return styles[vertical] ?? styles.generic;
  }

  private extractVisualSubject(topic: string, body: string): string {
    return topic || 'Professional subject matter';
  }

  private getMoodFromTone(score: number): string {
    return score > 80 ? 'energetic, bright, enthusiastic' : 'professional, clean, clear';
  }

  private async saveImageToPost(postId: string | undefined, img: any) {
    if (!postId) return;
    // update db logic here
  }

  async scoreVoiceMatch(brandVoiceId: string, content: string): Promise<{ score: number; feedback: string[] }> {
    const brandVoice = await this.prisma.brandVoice.findUnique({
      where: { id: brandVoiceId },
    });

    if (!brandVoice) return { score: 0, feedback: ['Brand voice not found'] };

    const tone = brandVoice.toneAttributes as Record<string, number>;

    const prompt = `Score how well this content matches the brand voice (0-100).

Brand voice:
- Name: ${brandVoice.name}
- Formality: ${tone.formality ?? 5}/10, Energy: ${tone.energy ?? 5}/10, Humor: ${tone.humor ?? 3}/10
- Vocabulary: ${brandVoice.vocabulary.slice(0, 10).join(', ')}
- Emoji usage: ${brandVoice.emojiUsage}
- Sentence style: ${brandVoice.sentenceStyle}

Content: "${content}"

Return JSON: { "score": 85, "feedback": ["Good energy match", "Could use more industry terms"] }`;

    return this.llm.completeJson<{ score: number; feedback: string[] }>(prompt);
  }
}
