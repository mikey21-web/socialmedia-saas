import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ListTemplatesQuery {
  vertical?: string;
  category?: string;
  goal?: string;
  difficulty?: string;
  language?: string;
  search?: string;
  limit?: number;
}

@Injectable()
export class ReelTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListTemplatesQuery = {}) {
    const where: Record<string, unknown> = { isActive: true };

    if (query.vertical && query.vertical !== 'all') {
      // include generic + specific vertical so customers always see useful options
      where.vertical = { in: [query.vertical, 'generic'] };
    }
    if (query.category) where.category = query.category;
    if (query.goal) where.goal = query.goal;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.language) where.language = query.language;
    if (query.search) {
      const q = query.search.toLowerCase();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    return this.prisma.reelTemplate.findMany({
      where,
      orderBy: [
        { engagementTier: 'asc' }, // 'high' < 'low' alphabetically — flip with tier weight
        { createdAt: 'desc' },
      ],
      take: query.limit ?? 100,
    });
  }

  async getById(id: string) {
    const t = await this.prisma.reelTemplate.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Reel template not found');
    return t;
  }

  async getBySlug(slug: string) {
    const t = await this.prisma.reelTemplate.findUnique({ where: { slug } });
    if (!t) throw new NotFoundException('Reel template not found');
    return t;
  }

  /**
   * Curated picks for a specific vertical and goal.
   * Returns 3 high-engagement templates suitable for a customer just starting out.
   */
  async curatedPicks(vertical: string, goal?: string) {
    const where: Record<string, unknown> = {
      isActive: true,
      vertical: { in: [vertical, 'generic'] },
      engagementTier: 'high',
      difficulty: { in: ['easy', 'medium'] },
    };
    if (goal) where.goal = goal;

    return this.prisma.reelTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
  }

  async listVerticalsWithCounts() {
    const grouped = await this.prisma.reelTemplate.groupBy({
      by: ['vertical'],
      where: { isActive: true },
      _count: { _all: true },
    });
    return grouped.map(g => ({ vertical: g.vertical, count: g._count._all }));
  }

  async listCategoriesWithCounts() {
    const grouped = await this.prisma.reelTemplate.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { _all: true },
    });
    return grouped.map(g => ({ category: g.category, count: g._count._all }));
  }
}
