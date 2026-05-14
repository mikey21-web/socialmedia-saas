import { PrismaClient } from '@prisma/client';
import { seedMusicTracks } from './seeds/music-tracks.seed';
import { seedEmailTemplates } from './seeds/email-templates.seed';
import { seedReelTemplates } from './seeds/reel-templates.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  const musicCount = await prisma.musicTrack.count();
  if (musicCount === 0) {
    await seedMusicTracks(prisma);
  } else {
    console.log(`Skipping music tracks: ${musicCount} already exist`);
  }

  await seedEmailTemplates(prisma);

  await seedReelTemplates(prisma);

  console.log('Seeding complete');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
