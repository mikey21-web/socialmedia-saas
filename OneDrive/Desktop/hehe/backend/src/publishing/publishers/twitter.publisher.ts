import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OauthService } from '../../platforms/oauth.service';

@Injectable()
export class TwitterPublisher {
  constructor(
    private readonly prisma: PrismaService,
    private readonly oauthService: OauthService,
  ) {}

  async publish(postId: string, credentialId: string): Promise<{ platformPostId: string }> {
    const [post, credential] = await Promise.all([
      this.prisma.post.findUnique({ where: { id: postId } }),
      this.oauthService.refreshTokenIfExpired(credentialId),
    ]);

    if (!post) throw new Error('Post not found');
    const accessToken = this.oauthService.decryptToken(credential.accessToken);
    const mediaUrls = this.toStringArray(post.mediaUrls);
    const mediaIds: string[] = [];

    for (const mediaUrl of mediaUrls.slice(0, 4)) {
      const mediaId = await this.uploadMedia(accessToken, mediaUrl);
      mediaIds.push(mediaId);
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: post.content,
        ...(mediaIds.length ? { media: { media_ids: mediaIds } } : {}),
      }),
    });

    const payload = await this.readJson(response);
    if (!response.ok) {
      throw new Error(this.extractError(payload, 'Twitter publish failed'));
    }

    const platformPostId = this.extractNestedString(payload, ['data', 'id']);
    if (!platformPostId) {
      throw new Error('Twitter response did not include a post id');
    }

    await this.prisma.postPlatform.updateMany({
      where: { postId, platform: { in: ['twitter', 'x'] } },
      data: { platformPostId, status: 'published' },
    });

    return { platformPostId };
  }

  private async uploadMedia(accessToken: string, mediaUrl: string) {
    const mediaResponse = await fetch(mediaUrl);
    const mediaBuffer = Buffer.from(await mediaResponse.arrayBuffer());
    const response = await fetch('https://api.twitter.com/2/media/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mediaResponse.headers.get('content-type') ?? 'application/octet-stream',
      },
      body: mediaBuffer,
    });
    const payload = await this.readJson(response);
    if (!response.ok) {
      throw new Error(this.extractError(payload, 'Twitter media upload failed'));
    }
    const mediaId = this.extractNestedString(payload, ['data', 'id']) ?? this.extractString(payload, 'media_id_string');
    if (!mediaId) throw new Error('Twitter media upload did not return a media id');
    return mediaId;
  }

  private toStringArray(value: unknown) {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  private async readJson(response: Response): Promise<Record<string, unknown>> {
    const text = await response.text();
    if (!text) return {};
    return JSON.parse(text) as Record<string, unknown>;
  }

  private extractString(payload: Record<string, unknown>, key: string) {
    const value = payload[key];
    return typeof value === 'string' ? value : null;
  }

  private extractNestedString(payload: Record<string, unknown>, path: string[]) {
    let current: unknown = payload;
    for (const key of path) {
      if (typeof current !== 'object' || current === null) return null;
      current = (current as Record<string, unknown>)[key];
    }
    return typeof current === 'string' ? current : null;
  }

  private extractError(payload: Record<string, unknown>, fallback: string) {
    const detail = this.extractString(payload, 'detail') ?? this.extractString(payload, 'error');
    if (detail) return detail;
    const errors = payload.errors;
    if (Array.isArray(errors) && typeof errors[0] === 'object' && errors[0] !== null) {
      const message = (errors[0] as Record<string, unknown>).message;
      if (typeof message === 'string') return message;
    }
    return fallback;
  }
}
