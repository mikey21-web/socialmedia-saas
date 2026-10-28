import { NextResponse } from 'next/server';
import { generatePosts } from '@/lib/ai';
import { createPost } from '@/lib/db';
import { publishPost } from '@/lib/publishing';
import type { CreatePostInput, Platform, Post } from '@/lib/types';
import { cleanText, parseCount, parsePlatforms, parseTone } from '@/lib/validate';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const topic = cleanText(body.topic, 300);
    if (!topic) throw new Error('Topic is required');

    const platforms = parsePlatforms(body.platforms);
    const tone = parseTone(body.tone);
    const count = parseCount(body.count, 3);
    const keywords = Array.isArray(body.keywords)
      ? body.keywords.map((keyword) => cleanText(keyword, 40)).filter(Boolean).slice(0, 6)
      : String(body.keywords ?? '')
          .split(',')
          .map((keyword) => keyword.trim())
          .filter(Boolean)
          .slice(0, 6);

    const result = await generatePosts({
      topic,
      platforms: platforms.length ? platforms : ['linkedin'],
      tone,
      count,
      keywords,
    });

    const saveMode = String(body.save ?? 'none');
    const saved: Post[] = [];
    let published = 0;

    if (['draft', 'scheduled', 'published'].includes(saveMode)) {
      let baseTime = Date.now() + 60 * 60 * 1000;
      if (saveMode === 'scheduled' && body.scheduledAt) {
        const parsed = new Date(String(body.scheduledAt)).getTime();
        if (!Number.isNaN(parsed)) baseTime = parsed;
      }

      for (let index = 0; index < result.posts.length; index += 1) {
        const generated = result.posts[index];
        const input: CreatePostInput = {
          content: generated.content,
          hashtags: generated.hashtags,
          platforms: [generated.platform as Platform],
          status: saveMode === 'published' ? 'draft' : (saveMode as 'draft' | 'scheduled'),
          scheduledAt:
            saveMode === 'scheduled' ? new Date(baseTime + index * 2 * 60 * 60 * 1000).toISOString() : null,
          tone: generated.tone,
          topic,
          source: 'ai',
        };
        const post = createPost(input);
        saved.push(post);
        if (saveMode === 'published') {
          const publishResult = await publishPost(post.id);
          if (publishResult.ok) published += 1;
        }
      }
    }

    return NextResponse.json({
      ...result,
      saved,
      published,
      requested: { topic, platforms, tone: tone ?? null, count },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
