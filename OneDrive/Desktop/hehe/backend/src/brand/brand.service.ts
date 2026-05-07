import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandProfileDto } from './dto/create-brand-profile.dto';
import { UpdateBrandProfileDto } from './dto/update-brand-profile.dto';
import { CreatePillarDto } from './dto/create-pillar.dto';
import { CreateCompetitorDto } from './dto/create-competitor.dto';
import { CreateVoiceExampleDto } from './dto/voice-example.dto';

export interface BrandContext {
  brandName: string;
  industry: string;
  description: string;
  voice: {
    tone: string;
    traits: string[];
    formality: number;
    alwaysWords: string[];
    neverWords: string[];
    emojiUsage: string;
    hashtagStyle: string;
  };
  audience: {
    age: string;
    gender: string;
    location: string[];
    interests: string[];
    painPoints: string[];
  };
  goals: { primary: string; secondary: string[] };
  platforms: string[];
  postsPerWeek: Record<string, number>;
  contentMix: Record<string, number>;
  pillars: { name: string; description: string; weight: number; keywords: string[] }[];
  competitors: { name: string; handles: Record<string, string> }[];
  voiceExamples: { content: string; platform?: string }[];
}

@Injectable()
export class BrandService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(teamId: string) {
    return this.prisma.brandProfile.findUnique({
      where: { teamId },
      include: { pillars: true, competitors: true, voiceExamples: true },
    });
  }

  async createProfile(teamId: string, dto: CreateBrandProfileDto) {
    const existing = await this.prisma.brandProfile.findUnique({ where: { teamId } });
    if (existing) {
      throw new ConflictException('Brand profile already exists for this team');
    }

    return this.prisma.brandProfile.create({
      data: {
        teamId,
        brandName: dto.brandName,
        industry: dto.industry,
        description: dto.description,
        voiceTone: dto.voiceTone ?? 'professional',
        voiceTraits: dto.voiceTraits ?? [],
        formalityLevel: dto.formalityLevel ?? 5,
        audienceAge: dto.audienceAge ?? '25-34',
        audienceGender: dto.audienceGender ?? 'all',
        audienceLocation: dto.audienceLocation ?? [],
        audienceInterests: dto.audienceInterests ?? [],
        audiencePainPoints: dto.audiencePainPoints ?? [],
        primaryGoal: dto.primaryGoal ?? 'awareness',
        secondaryGoals: dto.secondaryGoals ?? [],
        platforms: dto.platforms ?? [],
        postsPerWeek: dto.postsPerWeek ?? {},
        contentMix: dto.contentMix ?? {},
        alwaysWords: dto.alwaysWords ?? [],
        neverWords: dto.neverWords ?? [],
        emojiUsage: dto.emojiUsage ?? 'moderate',
        hashtagStyle: dto.hashtagStyle ?? 'moderate',
        autonomousMode: dto.autonomousMode ?? false,
        approvalRequired: dto.approvalRequired ?? true,
      },
    });
  }

  async updateProfile(teamId: string, dto: UpdateBrandProfileDto) {
    const profile = await this.prisma.brandProfile.findUnique({ where: { teamId } });
    if (!profile) {
      throw new NotFoundException('Brand profile not found');
    }

    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        data[key] = value;
      }
    }

    return this.prisma.brandProfile.update({
      where: { teamId },
      data,
    });
  }

  async completeOnboarding(teamId: string) {
    const profile = await this.prisma.brandProfile.findUnique({ where: { teamId } });
    if (!profile) {
      throw new NotFoundException('Brand profile not found');
    }

    return this.prisma.brandProfile.update({
      where: { teamId },
      data: { onboardingComplete: true },
    });
  }

  // ─── Pillars ──────────────────────────────────────────────────────────────────

  async listPillars(teamId: string) {
    const profile = await this.ensureProfile(teamId);
    return this.prisma.contentPillar.findMany({
      where: { brandProfileId: profile.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createPillar(teamId: string, dto: CreatePillarDto) {
    const profile = await this.ensureProfile(teamId);
    return this.prisma.contentPillar.create({
      data: {
        brandProfileId: profile.id,
        name: dto.name,
        description: dto.description,
        weight: dto.weight ?? 20,
        keywords: dto.keywords ?? [],
      },
    });
  }

  async updatePillar(teamId: string, pillarId: string, dto: Partial<CreatePillarDto>) {
    await this.ensureOwnsPillar(teamId, pillarId);
    return this.prisma.contentPillar.update({
      where: { id: pillarId },
      data: dto,
    });
  }

  async deletePillar(teamId: string, pillarId: string) {
    await this.ensureOwnsPillar(teamId, pillarId);
    return this.prisma.contentPillar.delete({ where: { id: pillarId } });
  }

  // ─── Competitors ──────────────────────────────────────────────────────────────

  async listCompetitors(teamId: string) {
    const profile = await this.ensureProfile(teamId);
    return this.prisma.competitor.findMany({
      where: { brandProfileId: profile.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createCompetitor(teamId: string, dto: CreateCompetitorDto) {
    const profile = await this.ensureProfile(teamId);
    return this.prisma.competitor.create({
      data: {
        brandProfileId: profile.id,
        name: dto.name,
        handles: dto.handles ?? {},
        url: dto.url,
        notes: dto.notes,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async deleteCompetitor(teamId: string, competitorId: string) {
    await this.ensureOwnsCompetitor(teamId, competitorId);
    return this.prisma.competitor.delete({ where: { id: competitorId } });
  }

  // ─── Voice Examples ───────────────────────────────────────────────────────────

  async listVoiceExamples(teamId: string) {
    const profile = await this.ensureProfile(teamId);
    return this.prisma.voiceExample.findMany({
      where: { brandProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createVoiceExample(teamId: string, dto: CreateVoiceExampleDto) {
    const profile = await this.ensureProfile(teamId);
    return this.prisma.voiceExample.create({
      data: {
        brandProfileId: profile.id,
        content: dto.content,
        platform: dto.platform,
        performanceScore: dto.performanceScore,
        source: dto.source ?? 'manual',
      },
    });
  }

  async deleteVoiceExample(teamId: string, exampleId: string) {
    await this.ensureOwnsVoiceExample(teamId, exampleId);
    return this.prisma.voiceExample.delete({ where: { id: exampleId } });
  }

  // ─── Brand Context (used by all agents) ───────────────────────────────────────

  async getBrandContext(teamId: string): Promise<BrandContext> {
    const profile = await this.prisma.brandProfile.findUnique({
      where: { teamId },
      include: {
        pillars: true,
        competitors: { where: { isActive: true } },
        voiceExamples: { orderBy: { performanceScore: 'desc' }, take: 20 },
      },
    });

    if (!profile) {
      throw new NotFoundException('Brand profile not found — complete onboarding first');
    }

    return {
      brandName: profile.brandName,
      industry: profile.industry,
      description: profile.description,
      voice: {
        tone: profile.voiceTone,
        traits: profile.voiceTraits,
        formality: profile.formalityLevel,
        alwaysWords: profile.alwaysWords,
        neverWords: profile.neverWords,
        emojiUsage: profile.emojiUsage,
        hashtagStyle: profile.hashtagStyle,
      },
      audience: {
        age: profile.audienceAge,
        gender: profile.audienceGender,
        location: profile.audienceLocation,
        interests: profile.audienceInterests,
        painPoints: profile.audiencePainPoints,
      },
      goals: {
        primary: profile.primaryGoal,
        secondary: profile.secondaryGoals,
      },
      platforms: profile.platforms,
      postsPerWeek: profile.postsPerWeek as Record<string, number>,
      contentMix: profile.contentMix as Record<string, number>,
      pillars: profile.pillars.map((p) => ({
        name: p.name,
        description: p.description,
        weight: p.weight,
        keywords: p.keywords,
      })),
      competitors: profile.competitors.map((c) => ({
        name: c.name,
        handles: c.handles as Record<string, string>,
      })),
      voiceExamples: profile.voiceExamples.map((e) => ({
        content: e.content,
        platform: e.platform ?? undefined,
      })),
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private async ensureProfile(teamId: string) {
    const profile = await this.prisma.brandProfile.findUnique({ where: { teamId } });
    if (!profile) {
      throw new NotFoundException('Brand profile not found');
    }
    return profile;
  }

  private async ensureOwnsPillar(teamId: string, pillarId: string) {
    const profile = await this.ensureProfile(teamId);
    const pillar = await this.prisma.contentPillar.findUnique({ where: { id: pillarId } });
    if (!pillar || pillar.brandProfileId !== profile.id) {
      throw new NotFoundException('Pillar not found');
    }
    return pillar;
  }

  private async ensureOwnsCompetitor(teamId: string, competitorId: string) {
    const profile = await this.ensureProfile(teamId);
    const competitor = await this.prisma.competitor.findUnique({ where: { id: competitorId } });
    if (!competitor || competitor.brandProfileId !== profile.id) {
      throw new NotFoundException('Competitor not found');
    }
    return competitor;
  }

  private async ensureOwnsVoiceExample(teamId: string, exampleId: string) {
    const profile = await this.ensureProfile(teamId);
    const example = await this.prisma.voiceExample.findUnique({ where: { id: exampleId } });
    if (!example || example.brandProfileId !== profile.id) {
      throw new NotFoundException('Voice example not found');
    }
    return example;
  }
}
