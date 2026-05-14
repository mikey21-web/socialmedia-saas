import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmService } from '../../agents/llm/llm.service';
import { ReelTemplateService } from './reel-template.service';
import type { ReelShot, ReelStructure } from './reel-templates.data';

export interface GenerateScriptInput {
  teamId: string;
  templateId?: string;
  topic: string;
  goal?: string;
  vertical?: string;
  language?: string;
  brandVoiceId?: string;
  trendSignalId?: string;
  variables?: Record<string, string>; // e.g. { dishName: 'Hyderabadi Biryani' }
}

export interface GeneratedScript {
  id: string;
  templateId: string | null;
  title: string;
  topic: string;
  vertical: string;
  goal: string;
  language: string;
  totalDuration: number;
  hook: string;
  patternInterrupt: string | null;
  cta: string;
  caption: string;
  hashtags: string[];
  shots: Array<ReelShot & { voiceover: string }>;
  audioSuggestion: { mood: string[]; bpm?: number; trackIds: string[] };
  filmingTips: string[];
  status: string;
}

@Injectable()
export class ReelScriptService {
  private readonly logger = new Logger(ReelScriptService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly templates: ReelTemplateService,
  ) {}

  /**
   * Generate a personalized reel script.
   *
   * Strategy:
   *  1. Load template (if templateId given) — provides structure, shots, hashtags.
   *  2. Pull brand voice + brand profile for personalization.
   *  3. Pull trend signal if provided — incorporates trending topic.
   *  4. Use LLM to fill template placeholders with brand-specific content.
   *  5. Suggest 3-5 trending audio tracks matching the mood.
   *  6. Persist a ReelScript record so the user can come back to it.
   */
  async generate(input: GenerateScriptInput): Promise<GeneratedScript> {
    if (!input.topic) throw new BadRequestException('topic is required');

    let template: Awaited<ReturnType<ReelTemplateService['getById']>> | null = null;
    if (input.templateId) {
      template = await this.templates.getById(input.templateId);
    }

    const vertical = input.vertical ?? template?.vertical ?? 'generic';
    const goal = input.goal ?? template?.goal ?? 'engagement';
    const language = input.language ?? template?.language ?? 'en';

    const [brandProfile, brandVoice, trend] = await Promise.all([
      this.prisma.brandProfile.findUnique({ where: { teamId: input.teamId } }),
      input.brandVoiceId
        ? this.prisma.brandVoice.findUnique({ where: { id: input.brandVoiceId } })
        : Promise.resolve(null),
      input.trendSignalId
        ? this.prisma.trendSignal.findUnique({ where: { id: input.trendSignalId } })
        : Promise.resolve(null),
    ]);

    const tone = (brandVoice?.toneAttributes as Record<string, number> | undefined) ?? {};

    const structure = (template?.structure ?? {
      hookSec: 1.5,
      patternInterruptSec: 5,
      ctaSec: 27,
      beats: ['Hook', 'Body', 'CTA'],
    }) as ReelStructure;
    const templateShots = (template?.shotList as ReelShot[] | undefined) ?? this.fallbackShots();
    const totalDuration = template?.estDurationSec ?? this.sumDurations(templateShots);

    const personalisationPrompt = this.buildScriptPrompt({
      topic: input.topic,
      vertical,
      goal,
      language,
      template,
      shots: templateShots,
      structure,
      brandName: brandProfile?.brandName ?? 'the brand',
      industry: brandProfile?.industry ?? vertical,
      voiceName: brandVoice?.name ?? 'default',
      tone,
      vocabulary: brandVoice?.vocabulary ?? [],
      avoidPhrases: brandVoice?.avoidPhrases ?? [],
      emojiUsage: brandVoice?.emojiUsage ?? 'moderate',
      trendValue: trend?.value,
      variables: input.variables ?? {},
    });

    const llmResult = await this.llm.completeJson<{
      title: string;
      hook: string;
      patternInterrupt?: string;
      cta: string;
      caption: string;
      hashtags: string[];
      shots: Array<{
        index: number;
        voiceover: string;
        textOverlay: string;
      }>;
      filmingTips: string[];
    }>(personalisationPrompt, { maxTokens: 2048 });

    // Merge LLM output back into template shot structure
    const mergedShots = templateShots.map((shot, idx) => {
      const llmShot = llmResult.shots?.find(s => s.index === shot.index) ?? llmResult.shots?.[idx];
      return {
        ...shot,
        textOverlay: llmShot?.textOverlay ?? shot.textOverlay,
        voiceover: llmShot?.voiceover ?? shot.voiceoverHint ?? '',
      };
    });

    // Pick trending audio that matches mood
    const audioMoods = (template?.audioMood as string[] | undefined) ?? ['trending', 'upbeat'];
    const trendingAudio = await this.prisma.trendingAudio.findMany({
      where: {
        isActive: true,
        platform: 'instagram',
        mood: { hasSome: audioMoods },
      },
      orderBy: { trendStrength: 'desc' },
      take: 5,
    });

    const audioSuggestion = {
      mood: audioMoods,
      bpm: trendingAudio[0]?.bpm ?? undefined,
      trackIds: trendingAudio.map(t => t.id),
    };

    const persisted = await this.prisma.reelScript.create({
      data: {
        teamId: input.teamId,
        templateId: input.templateId ?? null,
        title: llmResult.title || input.topic,
        topic: input.topic,
        vertical,
        goal,
        language,
        shots: mergedShots as unknown as object,
        hook: llmResult.hook,
        patternInterrupt: llmResult.patternInterrupt ?? null,
        cta: llmResult.cta,
        caption: llmResult.caption,
        hashtags: llmResult.hashtags ?? [],
        audioSuggestion,
        trendSignalId: input.trendSignalId ?? null,
        totalDuration,
        status: 'draft',
        filmingTips: (llmResult.filmingTips ?? this.defaultFilmingTips()) as unknown as object,
      },
    });

    return {
      id: persisted.id,
      templateId: persisted.templateId,
      title: persisted.title,
      topic: persisted.topic,
      vertical: persisted.vertical,
      goal: persisted.goal,
      language: persisted.language,
      totalDuration: persisted.totalDuration,
      hook: persisted.hook,
      patternInterrupt: persisted.patternInterrupt,
      cta: persisted.cta,
      caption: persisted.caption,
      hashtags: persisted.hashtags,
      shots: mergedShots,
      audioSuggestion,
      filmingTips: (persisted.filmingTips as string[]) ?? this.defaultFilmingTips(),
      status: persisted.status,
    };
  }

  async list(teamId: string, status?: string) {
    return this.prisma.reelScript.findMany({
      where: { teamId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getById(teamId: string, id: string) {
    const script = await this.prisma.reelScript.findFirst({
      where: { id, teamId },
    });
    if (!script) throw new NotFoundException('Script not found');
    return script;
  }

  async updateStatus(teamId: string, id: string, status: string) {
    await this.getById(teamId, id);
    return this.prisma.reelScript.update({
      where: { id },
      data: { status },
    });
  }

  async linkVideoProject(teamId: string, scriptId: string, videoProjectId: string) {
    await this.getById(teamId, scriptId);
    return this.prisma.reelScript.update({
      where: { id: scriptId },
      data: { videoProjectId, status: 'ready' },
    });
  }

  async delete(teamId: string, id: string) {
    await this.getById(teamId, id);
    await this.prisma.reelScript.delete({ where: { id } });
    return { ok: true };
  }

  /* ────────────────────────── Private helpers ──────────────────────────── */

  private sumDurations(shots: ReelShot[]): number {
    return shots.reduce((sum, s) => sum + (s.durationSec ?? 0), 0);
  }

  private fallbackShots(): ReelShot[] {
    return [
      {
        index: 1,
        durationSec: 2,
        action: 'Talk to camera with energy',
        cameraAngle: 'Selfie / eye level',
        lightingTip: 'Soft front light',
        propsNeeded: [],
        textOverlay: 'Hook',
        voiceoverHint: 'Energetic opener',
      },
      {
        index: 2,
        durationSec: 20,
        action: 'Main content — demonstrate or explain',
        cameraAngle: 'Mix of angles',
        lightingTip: 'Bright',
        propsNeeded: [],
        textOverlay: 'Body',
      },
      {
        index: 3,
        durationSec: 5,
        action: 'CTA — direct ask',
        cameraAngle: 'Eye level',
        lightingTip: 'Front',
        propsNeeded: [],
        textOverlay: 'CTA',
      },
    ];
  }

  private defaultFilmingTips(): string[] {
    return [
      'Film in good light — daylight near a window is best, free, and looks professional.',
      'Hold your phone vertically at chest or eye level — never lower.',
      'Lock exposure: tap-and-hold on your subject before recording.',
      'Record 5-10 extra seconds at the start and end — you can always trim later.',
      'Speak slightly louder and slower than you would in conversation.',
      'Capture a few extra B-roll clips so editing has options.',
    ];
  }

  private buildScriptPrompt(args: {
    topic: string;
    vertical: string;
    goal: string;
    language: string;
    template: Awaited<ReturnType<ReelTemplateService['getById']>> | null;
    shots: ReelShot[];
    structure: ReelStructure;
    brandName: string;
    industry: string;
    voiceName: string;
    tone: Record<string, number>;
    vocabulary: string[];
    avoidPhrases: string[];
    emojiUsage: string;
    trendValue?: string;
    variables: Record<string, string>;
  }): string {
    const formality = args.tone.formality ?? 5;
    const energy = args.tone.energy ?? 6;
    const humor = args.tone.humor ?? 4;

    const langInstruction =
      args.language === 'hi'
        ? 'Write in conversational Hindi using Roman script (Hinglish). Natural, the way an Indian creator would speak.'
        : args.language === 'ta'
          ? 'Write in Tamil + English mix (Tanglish), natural conversational style.'
          : args.language === 'te'
            ? 'Write in Telugu + English mix (Tenglish), natural conversational style.'
            : 'Write in clear, conversational English suited for Indian audience.';

    const variablesBlock = Object.entries(args.variables)
      .map(([k, v]) => `  ${k}: "${v}"`)
      .join('\n');

    const shotsBlock = args.shots
      .map(
        s =>
          `Shot ${s.index} (${s.durationSec}s):\n  Action: ${s.action}\n  Camera: ${s.cameraAngle}\n  Default text overlay: "${s.textOverlay}"`,
      )
      .join('\n\n');

    return `You are a Reel script writer for "${args.brandName}" (${args.industry}).
You write scripts that are CONCRETE, FILMABLE, and BRAND-SPECIFIC — never generic.

LANGUAGE: ${langInstruction}

BRAND VOICE: "${args.voiceName}"
- Formality: ${formality}/10  ·  Energy: ${energy}/10  ·  Humor: ${humor}/10
- Use these phrases naturally: ${args.vocabulary.slice(0, 8).join(', ') || '(none specified)'}
- AVOID these phrases: ${args.avoidPhrases.slice(0, 5).join(', ') || '(none specified)'}
- Emoji usage: ${args.emojiUsage}

GOAL: ${args.goal}
TOPIC: ${args.topic}
${args.trendValue ? `TRENDING ANGLE: "${args.trendValue}" — weave this in naturally if it fits.` : ''}

VARIABLES TO FILL (use these exact values):
${variablesBlock || '  (no variables provided — make sensible choices for the brand)'}

REEL STRUCTURE you must follow:
- Hook in first ${args.structure.hookSec}s (must stop the scroll)
- Pattern interrupt around ${args.structure.patternInterruptSec ?? 5}s
- CTA at ${args.structure.ctaSec}s

SHOTS (you must write voiceover + final text overlay for each):
${shotsBlock}

ENGAGEMENT RULES:
1. Hook must be a specific claim, question, or POV — never "Hey guys!"
2. Text overlays: max 6 words per overlay. Use 1-2 emojis max.
3. Voiceover: write what the person SAYS out loud — short sentences, conversational.
4. CTA: must be specific and actionable. "DM 'BOOK'" beats "Contact us".
5. Caption: 2-4 sentences max. End with a clear CTA. No essay.
6. Hashtags: 8-15 max. Mix of niche + medium + broad.

Return STRICT JSON:
{
  "title": "short script name for internal reference",
  "hook": "the exact words spoken in first 1.5s",
  "patternInterrupt": "what changes at the pattern interrupt moment",
  "cta": "the spoken CTA in last 2s",
  "caption": "the Instagram caption (2-4 sentences)",
  "hashtags": ["#tag1", "#tag2"],
  "shots": [
    { "index": 1, "voiceover": "exact spoken words", "textOverlay": "max 6 words" }
  ],
  "filmingTips": ["1-2 tips specific to THIS reel"]
}`;
  }
}
