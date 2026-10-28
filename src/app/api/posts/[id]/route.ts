import { NextResponse } from 'next/server';
import { deletePost, getPost, updatePost } from '@/lib/db';
import { publishPost } from '@/lib/publishing';
import type { PostStatus, Tone } from '@/lib/types';
import { cleanText, parseHashtags, parsePlatforms } from '@/lib/validate';

export const dynamic = 'force-dynamic';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const post = getPost(Number(id));
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const postId = Number(id);
    const existing = getPost(postId);
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const body = (await request.json()) as Record<string, unknown>;
    const requestedStatus = body.status ? (String(body.status) as PostStatus) : undefined;
    const publishNow = requestedStatus === 'published';

    let scheduledAt: string | undefined;
    if (body.scheduledAt !== undefined) {
      const raw = String(body.scheduledAt ?? '');
      const date = new Date(raw);
      if (!raw || Number.isNaN(date.getTime())) throw new Error('Provide a valid scheduled date and time');
      scheduledAt = date.toISOString();
    }

    const post = updatePost(postId, {
      content: body.content !== undefined ? cleanText(body.content, 10000) : undefined,
      hashtags: body.hashtags !== undefined ? parseHashtags(body.hashtags) : undefined,
      platforms: body.platforms !== undefined ? parsePlatforms(body.platforms) : undefined,
      status:
        requestedStatus && ['draft', 'scheduled'].includes(requestedStatus)
          ? requestedStatus
          : undefined,
      scheduledAt,
      tone: (body.tone as Tone | undefined) ?? undefined,
    });

    if (publishNow) {
      const result = await publishPost(postId);
      return NextResponse.json({ post: result.post, publish: result });
    }

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const deleted = deletePost(Number(id));
  if (!deleted) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
