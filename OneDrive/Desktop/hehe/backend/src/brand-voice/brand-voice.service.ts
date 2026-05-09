import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BrandVoiceExtractorService, ExtractionResult } from './brand-voice-extractor.service';
import { PaletteBuilderService } from './palette-builder.service';
import { SamplePostDto } from './dto/upload-samples.dto';
import { CreateProfileDto } from './dto/create-profile.dto';

@Injectable()
export class BrandVoiceService {
  private readonly logger = new Logger(BrandVoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly extractor: BrandVoiceExtractorService,
    private readonly paletteBuilder: PaletteBuilderService,
  ) {}

  async uploadSamples(
    teamId: string,
    posts: SamplePostDto[],
  ): Promise<{ extraction: ExtractionResult; sampleCount: number }> {
    const extraction = await this.extractor.extractAll(posts);
    return { extraction, sampleCount: posts.length };
  }

  async createProfile(
    teamId: string,
    dto: CreateProfileDto,
    extraction?: ExtractionResult,
    samples?: SamplePostDto[],
  ) {
    const palette = this.paletteBuilder.buildPalette(dto.primaryColor);

    const toneDimensions = extraction?.toneDimensions ?? {
      formality: 0.5,
      playfulness: 0.5,
      urgency: 0.3,
      warmth: 0.7,
      technicality: 0.2,
      authority: 0.5,
      vulnerability: 0.3,
      humor: 0.4,
      directness: 0.6,
      inspiration: 0.5,
    };

    const vocabularyBank = extraction?.vocabularyBank ?? {
      commonWords: [],
      avoidWords: [],
      industryTerms: [],
    };

    const emojiPatterns = extraction?.emojiPatterns ?? {
      frequency: 0.4,
      preferred: [],
      avoidEmojis: [],
    };

    const sentencePatterns = extraction?.sentencePatterns ?? {
      avgLength: 14,
      variation: 0.6,
      preferLists: false,
    };

    const hashtagStyle = extraction?.hashtagStyle ?? {
      placement: 'end' as const,
      count: 8,
      format: 'lowercase' as const,
    };

    let embeddingVector: number[] = [];
    if (samples?.length) {
      embeddingVector = await this.extractor.generateEmbedding(samples);
    }

    if (dto.isDefault) {
      await this.prisma.brandVoiceProfile.updateMany({
        where: { teamId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.brandVoiceProfile.create({
      data: {
        teamId,
        name: dto.name,
        isDefault: dto.isDefault ?? false,
        primaryColor: palette.primaryColor,
        brandLight: palette.brandLight,
        brandDark: palette.brandDark,
        lightBg: palette.lightBg,
        lightBorder: palette.lightBorder,
        darkBg: palette.darkBg,
        fontPrimary: dto.fontPrimary,
        fontSecondary: dto.fontSecondary,
        toneDimensions: toneDimensions as unknown as Prisma.InputJsonValue,
        vocabularyBank: vocabularyBank as unknown as Prisma.InputJsonValue,
        emojiPatterns: emojiPatterns as unknown as Prisma.InputJsonValue,
        sentencePatterns: sentencePatterns as unknown as Prisma.InputJsonValue,
        hashtagStyle: hashtagStyle as unknown as Prisma.InputJsonValue,
        embeddingVector,
        sampleCount: samples?.length ?? 0,
      },
    });
  }

  async listProfiles(teamId: string) {
    return this.prisma.brandVoiceProfile.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProfile(id: string) {
    const profile = await this.prisma.brandVoiceProfile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Brand voice profile not found');
    return profile;
  }

  async updateProfile(id: string, updates: Record<string, unknown>) {
    const profile = await this.prisma.brandVoiceProfile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Brand voice profile not found');
    return this.prisma.brandVoiceProfile.update({ where: { id }, data: updates });
  }

  async deleteProfile(id: string) {
    const profile = await this.prisma.brandVoiceProfile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Brand voice profile not found');
    await this.prisma.brandVoiceProfile.delete({ where: { id } });
    return { deleted: true };
  }

  async getDefaultProfile(teamId: string) {
    const profile = await this.prisma.brandVoiceProfile.findFirst({
      where: { teamId, isDefault: true },
    });
    if (!profile) {
      return this.prisma.brandVoiceProfile.findFirst({
        where: { teamId },
        orderBy: { createdAt: 'desc' },
      });
    }
    return profile;
  }

  async getRecentProfile(teamId: string) {
    return this.prisma.brandVoiceProfile.findFirst({
      where: { teamId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async validateContentMatchesVoice(
    profileId: string,
    content: string,
  ): Promise<{ score: number; details: string }> {
    const profile = await this.prisma.brandVoiceProfile.findUnique({
      where: { id: profileId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    if (profile.embeddingVector.length === 0) {
      return { score: 0.5, details: 'No embedding vector available for comparison' };
    }

    const voyageKey = process.env.VOYAGE_API_KEY;
    if (!voyageKey) {
      return { score: 0.5, details: 'Embedding API not configured' };
    }

    try {
      const response = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${voyageKey}`,
        },
        body: JSON.stringify({
          input: [content.slice(0, 4000)],
          model: 'voyage-3-large',
        }),
      });

      const data = (await response.json()) as {
        data?: Array<{ embedding: number[] }>;
      };

      const contentVector = data.data?.[0]?.embedding;
      if (!contentVector) {
        return { score: 0.5, details: 'Failed to generate content embedding' };
      }

      const score = this.cosineSimilarity(profile.embeddingVector, contentVector);
      return {
        score: Math.round(score * 100) / 100,
        details: score >= 0.75 ? 'Strong voice match' : score >= 0.5 ? 'Moderate voice match' : 'Weak voice match',
      };
    } catch {
      return { score: 0.5, details: 'Embedding comparison failed' };
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    if (len === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}
