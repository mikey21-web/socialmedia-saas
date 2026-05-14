import { PrismaClient, Prisma } from '@prisma/client';
import { REEL_TEMPLATES } from '../../src/agency/reel-studio/reel-templates.data';

export async function seedReelTemplates(prisma: PrismaClient): Promise<number> {
  let created = 0;
  let updated = 0;

  for (const t of REEL_TEMPLATES) {
    const data = {
      slug: t.slug,
      title: t.title,
      category: t.category,
      vertical: t.vertical,
      goal: t.goal,
      difficulty: t.difficulty,
      estDurationSec: t.estDurationSec,
      shotCount: t.shotCount,
      shotList: t.shotList as unknown as Prisma.InputJsonValue,
      structure: t.structure as unknown as Prisma.InputJsonValue,
      captionTemplate: t.captionTemplate,
      hashtagSets: t.hashtagSets as unknown as Prisma.InputJsonValue,
      audioMood: t.audioMood,
      language: t.language,
      engagementTier: t.engagementTier,
      tags: t.tags,
      isActive: true,
    };

    const result = await prisma.reelTemplate.upsert({
      where: { slug: t.slug },
      create: data,
      update: data,
    });

    if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
    else updated++;
  }

  console.log(`Reel templates: ${created} created, ${updated} updated (total ${REEL_TEMPLATES.length})`);
  return created;
}
