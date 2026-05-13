import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LlmService } from '../../../agents/llm/llm.service';
import { MediaService } from '../../../media/media.service';
import { AgentRunLoggerService } from '../../agent-run-logger.service';
import {
  UgcScriptBrief,
  UgcScript,
  buildUgcScriptPrompt,
  buildBrollPrompts,
} from './ugc-script.prompt';

export interface UgcVideoBrief {
  teamId: string;
  topic: string;
  platform: 'tiktok' | 'instagram' | 'youtube_shorts' | 'facebook';
  videoStyle: 'talking_head' | 'voiceover_broll' | 'mixed';
  maxDurationSec?: number;
  trendContext?: string;
  targetAudience?: string;
  heygenAvatarId?: string;
  heygenVoiceId?: string;
  heygenAvatarType?: 'avatar' | 'talking_photo';
}

export interface UgcVideoResult {
  script: UgcScript;
  avatarVideoUrl?: string;
  avatarVideoJobId?: string;
  brollUrls: string[];
  thumbnailUrl?: string;
  caption: string;
  hashtags: string[];
  status: 'complete' | 'avatar_pending' | 'partial';
}

@Injectable()
export class UgcVideoService {
  private readonly logger = new Logger(UgcVideoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly media: MediaService,
    private readonly runLogger: AgentRunLoggerService,
  ) {}

  /**
   * Full UGC video pipeline:
   * 1. Load brand voice
   * 2. Generate script via LLM
   * 3. Generate talking-head video via HeyGen (if applicable)
   * 4. Generate b-roll clips via Replicate (if applicable)
   * 5. Generate thumbnail
   * 6. Return everything for assembly
   */
  async generateUgcVideo(brief: UgcVideoBrief): Promise<UgcVideoResult> {
    const start = Date.now();

    // 1. Load brand voice
    const brandVoice = await this.prisma.brandVoice.findFirst({
      where: { teamId: brief.teamId, isActive: true },
    });

    const brandProfile = await this.prisma.brandProfile.findFirst({
      where: { teamId: brief.teamId },
    });

    const voiceData = {
      formality: 5,
      energy: 7,
      humor: 4,
      vocabulary: [] as string[],
      emojiUsage: 'moderate',
    };

    if (brandVoice) {
      const tone = brandVoice.toneAttributes as Record<string, number>;
      voiceData.formality = tone.formality ?? 5;
      voiceData.energy = tone.energy ?? 7;
      voiceData.humor = tone.humor ?? 4;
      voiceData.vocabulary = brandVoice.vocabulary ?? [];
      voiceData.emojiUsage = brandVoice.emojiUsage ?? 'moderate';
    }

    // 2. Generate UGC script
    const scriptBrief: UgcScriptBrief = {
      teamId: brief.teamId,
      topic: brief.topic,
      platform: brief.platform,
      brandName: brandProfile?.brandName ?? brandVoice?.name ?? 'Brand',
      brandVoice: voiceData,
      trendContext: brief.trendContext,
      targetAudience: brief.targetAudience,
      videoStyle: brief.videoStyle,
      maxDurationSec: brief.maxDurationSec ?? 30,
    };

    const prompt = buildUgcScriptPrompt(scriptBrief);
    const script = await this.llm.completeJson<UgcScript>(prompt, {
      maxTokens: 2048,
      temperature: 0.8,
    });

    this.logger.log(`UGC script generated: ${script.hook?.slice(0, 60)}...`);

    // 3. Start HeyGen avatar video (if talking_head or mixed)
    let avatarVideoUrl: string | undefined;
    let avatarVideoJobId: string | undefined;

    const needsAvatar = brief.videoStyle === 'talking_head' || brief.videoStyle === 'mixed';

    if (needsAvatar && brief.heygenAvatarId && brief.heygenVoiceId) {
      try {
        // Combine hook + talking_head segments + CTA into full avatar script
        const talkingParts = [script.hook];
        for (const seg of script.segments) {
          if (seg.type === 'talking_head') {
            talkingParts.push(seg.text);
          }
        }
        talkingParts.push(script.cta);
        const fullAvatarScript = talkingParts.join(' ');

        const aspectRatio = brief.platform === 'youtube_shorts' || brief.platform === 'tiktok' || brief.platform === 'instagram'
          ? 'story'
          : 'landscape';

        // Start async — don't block on completion
        const job = await this.media.heygenStart(brief.teamId, {
          script: fullAvatarScript,
          avatarId: brief.heygenAvatarId,
          voiceId: brief.heygenVoiceId,
          type: brief.heygenAvatarType ?? 'avatar',
          aspectRatio,
          captions: true,
        });

        avatarVideoJobId = job.jobId;
        this.logger.log(`HeyGen video started: ${job.jobId}`);
      } catch (err) {
        this.logger.warn(`HeyGen avatar video failed: ${(err as Error).message}`);
      }
    }

    // 4. Generate b-roll clips via Replicate
    const brollUrls: string[] = [];
    const brollPrompts = buildBrollPrompts(script);

    for (const bp of brollPrompts) {
      try {
        const result = await this.media.generateVideo(
          brief.teamId,
          bp.prompt,
          Math.min(bp.durationSec, 5),
        );
        brollUrls.push(result.url);
        this.logger.log(`B-roll generated: ${bp.prompt.slice(0, 50)}...`);
      } catch (err) {
        this.logger.warn(`B-roll generation failed: ${(err as Error).message}`);
      }
    }

    // 5. Generate thumbnail
    let thumbnailUrl: string | undefined;
    if (script.thumbnailPrompt) {
      try {
        const thumb = await this.media.generateImage(brief.teamId, script.thumbnailPrompt);
        thumbnailUrl = thumb.url;
      } catch (err) {
        this.logger.warn(`Thumbnail generation failed: ${(err as Error).message}`);
      }
    }

    // 6. Determine status
    let status: UgcVideoResult['status'] = 'complete';
    if (avatarVideoJobId && !avatarVideoUrl) {
      status = 'avatar_pending';
    }
    if (needsAvatar && !avatarVideoJobId && brollUrls.length === 0) {
      status = 'partial';
    }

    const result: UgcVideoResult = {
      script,
      avatarVideoUrl,
      avatarVideoJobId,
      brollUrls,
      thumbnailUrl,
      caption: script.caption,
      hashtags: script.hashtags,
      status,
    };

    // Log the run
    await this.runLogger.log({
      teamId: brief.teamId,
      agentRole: 'ugc_video',
      triggerType: 'manual',
      input: brief as unknown as Record<string, unknown>,
      output: {
        scriptHook: script.hook,
        segmentCount: script.segments.length,
        brollCount: brollUrls.length,
        hasAvatar: !!avatarVideoJobId,
        hasThumbnail: !!thumbnailUrl,
        status,
      },
      tokensUsed: 2000,
      durationMs: Date.now() - start,
      status: 'success',
    });

    return result;
  }

  /**
   * Script-only mode — just generate the UGC script without media.
   * Useful for previewing/editing before committing to video generation.
   */
  async generateScript(brief: UgcVideoBrief): Promise<UgcScript> {
    const brandVoice = await this.prisma.brandVoice.findFirst({
      where: { teamId: brief.teamId, isActive: true },
    });

    const brandProfile = await this.prisma.brandProfile.findFirst({
      where: { teamId: brief.teamId },
    });

    const tone = (brandVoice?.toneAttributes ?? {}) as Record<string, number>;

    const scriptBrief: UgcScriptBrief = {
      teamId: brief.teamId,
      topic: brief.topic,
      platform: brief.platform,
      brandName: brandProfile?.brandName ?? brandVoice?.name ?? 'Brand',
      brandVoice: {
        formality: tone.formality ?? 5,
        energy: tone.energy ?? 7,
        humor: tone.humor ?? 4,
        vocabulary: brandVoice?.vocabulary ?? [],
        emojiUsage: brandVoice?.emojiUsage ?? 'moderate',
      },
      trendContext: brief.trendContext,
      targetAudience: brief.targetAudience,
      videoStyle: brief.videoStyle,
      maxDurationSec: brief.maxDurationSec ?? 30,
    };

    return this.llm.completeJson<UgcScript>(buildUgcScriptPrompt(scriptBrief), {
      maxTokens: 2048,
      temperature: 0.8,
    });
  }

  /**
   * Check the status of a HeyGen avatar video job.
   */
  async checkAvatarStatus(teamId: string, jobId: string) {
    return this.media.heygenCheckStatus(teamId, jobId);
  }

  /**
   * Batch generate UGC videos from content briefs.
   * Called by the Boss Agent when delegating UGC work.
   */
  async generateFromBriefs(
    teamId: string,
    briefs: { topic: string; platform: string }[],
    defaultOptions?: {
      heygenAvatarId?: string;
      heygenVoiceId?: string;
      heygenAvatarType?: 'avatar' | 'talking_photo';
    },
  ): Promise<{ count: number; results: UgcVideoResult[] }> {
    const results: UgcVideoResult[] = [];

    for (const brief of briefs.slice(0, 3)) { // Cap at 3 per cycle
      try {
        const result = await this.generateUgcVideo({
          teamId,
          topic: brief.topic,
          platform: (brief.platform as UgcVideoBrief['platform']) || 'instagram',
          videoStyle: defaultOptions?.heygenAvatarId ? 'mixed' : 'voiceover_broll',
          heygenAvatarId: defaultOptions?.heygenAvatarId,
          heygenVoiceId: defaultOptions?.heygenVoiceId,
          heygenAvatarType: defaultOptions?.heygenAvatarType,
        });
        results.push(result);
      } catch (err) {
        this.logger.warn(`UGC video failed for "${brief.topic}": ${(err as Error).message}`);
      }
    }

    return { count: results.length, results };
  }
}
