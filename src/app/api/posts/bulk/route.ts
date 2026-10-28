import { NextResponse } from 'next/server';
import { createPost } from '@/lib/db';
import { publishPost } from '@/lib/publishing';
import type { Post, PostStatus, Tone } from '@/lib/types';
import { cleanText, parseHashtags, parsePlatforms } from '@/lib/validate';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const items = Array.isArray(body.posts) ? body.posts : [];
    if (items.length === 0) throw new Error('No posts supplied');

    const requested = String(body.status ?? 'draft') as PostStatus;
    const status: PostStatus = ['draft', 'scheduled', 'published'].includes(requested) ? requested : 'draft';
    const topic = cleanText(body.topic, 300) || null;
    const tone = (body.tone as Tone | undefined) ?? undefined;

    let baseTime = Date.now() + 60 * 60 * 1000;
    if (status === 'scheduled' && body.scheduledAt) {
      const parsed = new Date(String(body.scheduledAt)).getTime();
      if (Number.isNaN(parsed)) throw new Error('Provide a valid scheduled date and time');
      baseTime = parsed;
    }

    const saved: Post[] = [];
    let published = 0;

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index] as Record<string, unknown>;
      const content = cleanText(item.content, 10000);
      if (!content) continue;
      const platforms = parsePlatforms(item.platforms ?? [item.platform]);
      if (platforms.length === 0) continue;

      const post = createPost({
        content,
        hashtags: parseHashtags(item.hashtags),
        platforms,
        status: status === 'published' ? 'draft' : status,
        scheduledAt:
          status === 'scheduled' ? new Date(baseTime + index * 2 * 60 * 60 * 1000).toISOString() : null,
        tone: (item.tone as Tone | undefined) ?? tone,
        topic,
        source: body.source === 'ai' ? 'ai' : 'manual',
      });
      saved.push(post);
      if (status === 'published') {
        const result = await publishPost(post.id);
        if (result.ok) published += 1;
      }
    }

    if (saved.length === 0) throw new Error('None of the posts had valid content and platforms');
    return NextResponse.json({ saved, published }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

