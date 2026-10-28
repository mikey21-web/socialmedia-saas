import { NextResponse } from 'next/server';
import { createPost, listPosts } from '@/lib/db';
import { publishPost } from '@/lib/publishing';
import type { PostStatus, Tone } from '@/lib/types';
import { cleanText, parseHashtags, parsePlatforms } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const posts = listPosts({
      status: searchParams.get('status') ?? undefined,
      platform: searchParams.get('platform') ?? undefined,
      q: searchParams.get('q') ?? undefined,
      limit: Number(searchParams.get('limit') ?? 200),
    });
    return NextResponse.json({ posts, count: posts.length });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const content = cleanText(body.content, 10000);
    const platforms = parsePlatforms(body.platforms);
    const requestedStatus = String(body.status ?? 'draft') as PostStatus;
    const status: PostStatus = ['draft', 'scheduled', 'published'].includes(requestedStatus)
      ? requestedStatus
      : 'draft';

    let scheduledAt: string | null = null;
    if (status === 'scheduled') {
      const raw = String(body.scheduledAt ?? '');
      const date = new Date(raw);
      if (!raw || Number.isNaN(date.getTime())) throw new Error('Provide a valid scheduled date and time');
      scheduledAt = date.toISOString();
    }

    const post = createPost({
      content,
      hashtags: parseHashtags(body.hashtags),
      platforms,
      status: status === 'published' ? 'draft' : status,
      scheduledAt,
      tone: (body.tone as Tone | undefined) ?? null,
      topic: cleanText(body.topic, 200) || null,
      source: body.source === 'ai' ? 'ai' : 'manual',
    });

    if (status === 'published') {
      const result = await publishPost(post.id);
      return NextResponse.json({ post: result.post, publish: result }, { status: 201 });
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
