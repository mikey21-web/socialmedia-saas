import { PrismaClient } from '@prisma/client';

/**
 * Seed royalty-free music tracks for the video pipeline.
 * Uses Pixabay Music public-domain CC0 tracks. Replace with your
 * licensed music library URLs when you go to production.
 */

const TRACKS = [
  {
    title: 'Energetic Pop',
    artist: 'AlexProductions',
    genre: 'pop',
    mood: 'upbeat',
    duration: 60,
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    bpm: 120,
    tags: ['energetic', 'pop', 'happy', 'product'],
  },
  {
    title: 'Cinematic Inspiration',
    artist: 'AlexiAction',
    genre: 'cinematic',
    mood: 'inspirational',
    duration: 90,
    url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_2dde668ca0.mp3',
    bpm: 95,
    tags: ['inspirational', 'cinematic', 'epic'],
  },
  {
    title: 'Lo-fi Chill',
    artist: 'FASSounds',
    genre: 'lofi',
    mood: 'chill',
    duration: 120,
    url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_2e26a2c4f8.mp3',
    bpm: 85,
    tags: ['chill', 'lofi', 'study', 'background'],
  },
  {
    title: 'Corporate Motivational',
    artist: 'SergePavkinMusic',
    genre: 'corporate',
    mood: 'motivational',
    duration: 90,
    url: 'https://cdn.pixabay.com/audio/2022/04/27/audio_3e1ba8a9c2.mp3',
    bpm: 110,
    tags: ['corporate', 'business', 'professional', 'b2b'],
  },
  {
    title: 'Trap Beat',
    artist: 'AlexProductions',
    genre: 'hip-hop',
    mood: 'energetic',
    duration: 60,
    url: 'https://cdn.pixabay.com/audio/2022/06/15/audio_e2e6a76d23.mp3',
    bpm: 140,
    tags: ['hip-hop', 'trap', 'street', 'fashion'],
  },
  {
    title: 'Electronic Dance',
    artist: 'PowerLightProduction',
    genre: 'electronic',
    mood: 'energetic',
    duration: 75,
    url: 'https://cdn.pixabay.com/audio/2022/08/24/audio_2c1ca6cee8.mp3',
    bpm: 128,
    tags: ['edm', 'dance', 'electronic', 'gym', 'fitness'],
  },
  {
    title: 'Soft Acoustic',
    artist: 'SergeQuadrado',
    genre: 'acoustic',
    mood: 'calm',
    duration: 90,
    url: 'https://cdn.pixabay.com/audio/2023/03/01/audio_a4d9cf76f2.mp3',
    bpm: 75,
    tags: ['acoustic', 'guitar', 'calm', 'romantic', 'wellness'],
  },
  {
    title: 'Funky Disco',
    artist: 'Olexy',
    genre: 'funk',
    mood: 'fun',
    duration: 60,
    url: 'https://cdn.pixabay.com/audio/2022/05/16/audio_5e3c8c0ad7.mp3',
    bpm: 115,
    tags: ['funk', 'disco', 'fun', 'food', 'restaurant'],
  },
  {
    title: 'Tech House',
    artist: 'PinkBlueMusic',
    genre: 'electronic',
    mood: 'modern',
    duration: 90,
    url: 'https://cdn.pixabay.com/audio/2024/01/09/audio_8d7a0c4e91.mp3',
    bpm: 124,
    tags: ['tech', 'modern', 'saas', 'product'],
  },
  {
    title: 'Smooth Jazz',
    artist: 'SergeQuadrado',
    genre: 'jazz',
    mood: 'relaxed',
    duration: 90,
    url: 'https://cdn.pixabay.com/audio/2023/05/19/audio_3f01fb3a1f.mp3',
    bpm: 95,
    tags: ['jazz', 'smooth', 'relaxed', 'cafe'],
  },
];

export async function seedMusicTracks(prisma: PrismaClient) {
  for (const track of TRACKS) {
    await prisma.musicTrack.create({
      data: {
        title: track.title,
        artist: track.artist,
        genre: track.genre,
        mood: track.mood,
        duration: track.duration,
        url: track.url,
        licenseType: 'royalty_free',
        bpm: track.bpm,
        tags: track.tags,
      },
    });
  }
  console.log(`Seeded ${TRACKS.length} music tracks`);
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedMusicTracks(prisma)
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
