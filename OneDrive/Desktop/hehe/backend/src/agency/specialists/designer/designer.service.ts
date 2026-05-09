import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReplicateProvider } from '../../../ai/replicate/replicate.provider';
import { R2StorageService } from '../../../media/r2-storage.service';
import { ImageAdapterService } from './image-adapter.service';
import { AgentRunLoggerService } from '../../agent-run-logger.service';
import { nanoid } from 'nanoid';

export interface ImageGenerationBrief {
  teamId: string;
  postId?: string;
  subject: string;           // "Hair transformation, before/after"
  style: string;             // "clean, bright, professional salon photography"
  mood: string;              // "warm, welcoming, confident"
  colorPalette?: string[];   // from BrandVoiceProfile
  platform: string[];        // which platforms to adapt for
  imageType: 'post' | 'carousel_slide' | 'story' | 'thumbnail';
  negativePrompt?: string;   // "text, watermark, logo"
  quality?: 'draft' | 'final';
}

export interface GeneratedImageResult {
  sourceUrl: string;         // original 1024x1024 from Replicate
  platformUrls: Record<string, string>; // per-platform adapted URLs
  generationPrompt: string;
  costEstimateUsd: number;
}

@Injectable()
export class DesignerService {
  constructor(
    private prisma: PrismaService,
    private replicate: ReplicateProvider,
    private r2: R2StorageService,
    private adapter: ImageAdapterService,
    private logger: AgentRunLoggerService,
  ) {}

  async generateImage(brief: ImageGenerationBrief): Promise<GeneratedImageResult> {
    const runId = nanoid();
    await this.logger.start(brief.teamId, 'designer', runId, 'generate_image', brief);

    try {
      // Build prompt from brief
      const prompt = this.buildPrompt(brief);

      // Generate at 1024x1024 base
      const sourceBuffer = await this.replicate.generateImage(prompt, {
        width: 1024,
        height: 1024,
        quality: brief.quality,
      });

      // Upload source
      const sourceUrl = await this.r2.uploadBuffer(
        sourceBuffer,
        `source-${nanoid()}.png`
      );

      // Adapt for each platform
      const adaptedBuffers = await this.adapter.adaptForAllPlatforms(
        sourceBuffer,
        brief.platform
      );

      const platformUrls: Record<string, string> = {};
      for (const [platform, buffer] of Object.entries(adaptedBuffers)) {
        platformUrls[platform] = await this.r2.uploadBuffer(
          buffer,
          `${platform}-${nanoid()}.png`
        );
      }

      const result = {
        sourceUrl,
        platformUrls,
        generationPrompt: prompt,
        costEstimateUsd: 0.003,  // Flux Schnell ~$0.003 per image
      };

      await this.logger.succeed(runId, result);
      return result;
    } catch (error) {
      await this.logger.fail(runId, (error as Error).message);
      throw error;
    }
  }

  async generateVariants(brief: ImageGenerationBrief, count = 3): Promise<GeneratedImageResult[]> {
    const prompt = this.buildPrompt(brief);
    const buffers = await this.replicate.generateMultiple(prompt, count, {
      width: 1024,
      height: 1024,
      quality: brief.quality,
    });

    const results: GeneratedImageResult[] = [];
    for (const buffer of buffers) {
      const sourceUrl = await this.r2.uploadBuffer(buffer, `variant-${nanoid()}.png`);
      const platformUrls: Record<string, string> = {};
      for (const [platform, adapted] of Object.entries(
        await this.adapter.adaptForAllPlatforms(buffer, brief.platform)
      )) {
        platformUrls[platform] = await this.r2.uploadBuffer(adapted, `${platform}-${nanoid()}.png`);
      }
      results.push({ sourceUrl, platformUrls, generationPrompt: prompt, costEstimateUsd: 0.003 });
    }
    return results;
  }

  async generateThumbnail(
    teamId: string,
    videoTitle: string,
    brandPrimaryColor: string
  ): Promise<{ url: string }> {
    const prompt = `YouTube thumbnail for "${videoTitle}". 
      Bold text space on left. Expressive subject on right.
      Brand color accent: ${brandPrimaryColor}.
      Clean, high contrast, professional.`;

    const buffer = await this.replicate.generateImage(prompt, {
      width: 1280,
      height: 720,
      quality: 'final',
    });

    const url = await this.r2.uploadBuffer(buffer, `thumbnail-${nanoid()}.png`);
    return { url };
  }

  async generateCarouselCoverImage(
    teamId: string,
    topic: string,
    brandColors: { primary: string; light: string; dark: string }
  ): Promise<{ url: string }> {
    const prompt = `Professional cover image for Instagram carousel about "${topic}".
      Clean background in ${brandColors.light}.
      Minimal design. Leave space for text overlay.
      High quality, 4:5 aspect.
      Style: modern flat design, no text.`;

    const buffer = await this.replicate.generateImage(prompt, {
      width: 1080,
      height: 1350,
      quality: 'final',
    });

    const url = await this.r2.uploadBuffer(buffer, `carousel-cover-${nanoid()}.png`);
    return { url };
  }

  private buildPrompt(brief: ImageGenerationBrief): string {
    const colorHint = brief.colorPalette?.length
      ? `Color palette: ${brief.colorPalette.join(', ')}.`
      : '';

    return [
      `${brief.subject}.`,
      `Style: ${brief.style}.`,
      `Mood: ${brief.mood}.`,
      colorHint,
      'No text, no watermarks, no logos.',
      'High quality, sharp, professionally composed.',
      brief.negativePrompt ? `Avoid: ${brief.negativePrompt}.` : '',
    ]
      .filter(Boolean)
      .join(' ');
  }
}
