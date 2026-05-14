import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Trending audio library for Reels.
 *
 * Note on data source:
 * Instagram and TikTok do NOT expose trending audio via official APIs to most apps.
 * Our library is manually curated + updated weekly by the content team.
 * This is the same approach used by tools like Trendsta, Flick, and Later.
 *
 * Customers see:
 *  - The audio name + artist
 *  - Mood/BPM/duration so they can pick by feel
 *  - Trend strength (1-10)
 *  - A preview URL when available
 *
 * Customers add the audio in Instagram itself when posting (we can't upload it
 * for them). We give them the audio name to search for.
 */
@Injectable()
export class TrendingAudioService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: { platform?: string; mood?: string; vertical?: string; language?: string; limit?: number } = {}) {
    const where: Record<string, unknown> = { isActive: true };
    if (filters.platform) where.platform = filters.platform;
    if (filters.mood) where.mood = { has: filters.mood };
    if (filters.vertical) where.verticals = { has: filters.vertical };
    if (filters.language) where.language = filters.language;

    return this.prisma.trendingAudio.findMany({
      where,
      orderBy: { trendStrength: 'desc' },
      take: filters.limit ?? 50,
    });
  }

  async getById(id: string) {
    return this.prisma.trendingAudio.findUnique({ where: { id } });
  }

  /**
   * Pick top trending audio by mood — used by ReelScriptService.
   */
  async pickByMoods(moods: string[], platform = 'instagram', limit = 5) {
    return this.prisma.trendingAudio.findMany({
      where: {
        isActive: true,
        platform,
        mood: { hasSome: moods },
      },
      orderBy: { trendStrength: 'desc' },
      take: limit,
    });
  }

  /**
   * Add or update a trending audio (admin / curator).
   */
  async upsert(input: {
    title: string;
    artist?: string;
    platform?: string;
    externalId?: string;
    externalUrl?: string;
    previewUrl?: string;
    duration?: number;
    bpm?: number;
    mood?: string[];
    verticals?: string[];
    language?: string;
    trendStrength?: number;
    isLicensed?: boolean;
    tags?: string[];
    expiresAt?: Date;
  }) {
    if (input.externalId) {
      const existing = await this.prisma.trendingAudio.findFirst({
        where: { externalId: input.externalId, platform: input.platform ?? 'instagram' },
      });
      if (existing) {
        return this.prisma.trendingAudio.update({
          where: { id: existing.id },
          data: input,
        });
      }
    }

    return this.prisma.trendingAudio.create({
      data: {
        title: input.title,
        artist: input.artist,
        platform: input.platform ?? 'instagram',
        externalId: input.externalId,
        externalUrl: input.externalUrl,
        previewUrl: input.previewUrl,
        duration: input.duration ?? 30,
        bpm: input.bpm,
        mood: input.mood ?? [],
        verticals: input.verticals ?? [],
        language: input.language ?? 'en',
        trendStrength: input.trendStrength ?? 5,
        isLicensed: input.isLicensed ?? false,
        tags: input.tags ?? [],
        expiresAt: input.expiresAt,
      },
    });
  }

  /**
   * Mark expired tracks inactive (cron job).
   */
  async expireOldTracks() {
    const now = new Date();
    return this.prisma.trendingAudio.updateMany({
      where: { expiresAt: { lt: now }, isActive: true },
      data: { isActive: false },
    });
  }
}
