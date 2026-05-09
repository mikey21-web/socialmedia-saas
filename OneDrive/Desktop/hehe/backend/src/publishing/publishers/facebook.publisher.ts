import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OauthService } from '../../platforms/oauth.service';

const GRAPH = 'https://graph.facebook.com/v20.0';

@Injectable()
export class FacebookPublisher {
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

    const pageToken = this.oauthService.decryptToken(credential.accessToken);
    const pageId = credential.accountId;

    if (!pageId) {
      throw new Error('Facebook Page ID missing — re-connect your Facebook account');
    }

    const mediaUrls = this.toStringArray(post.mediaUrls);
    const firstMedia = mediaUrls[0];
    let finalId = '';

    if (firstMedia && /\.(mp4|mov|avi|mkv)$/i.test(firstMedia)) {
      finalId = await this.publishVideo(pageId, pageToken, firstMedia, post.content);
    } else if (mediaUrls.length > 1) {
      finalId = await this.publishCarousel(pageId, pageToken, mediaUrls, post.content);
    } else if (mediaUrls.length === 1) {
      finalId = await this.publishPhoto(pageId, pageToken, firstMedia!, post.content);
    } else {
      finalId = await this.publishText(pageId, pageToken, post.content);
    }

    await this.prisma.postPlatform.updateMany({
      where: { postId, platform: 'facebook' },
      data: { platformPostId: finalId, status: 'published' },
    });

    return { platformPostId: finalId };
  }

  private async publishText(pageId: string, pageToken: string, content: string): Promise<string> {
    const res = await fetch(`${GRAPH}/${pageId}/feed?access_token=${pageToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content, published: true }),
    });
    const json = (await res.json()) as { id?: string; error?: { message?: string } };
    if (!res.ok || !json.id) {
      throw new Error(json.error?.message ?? 'Facebook text post failed');
    }
    return json.id;
  }

  private async publishPhoto(
    pageId: string,
    pageToken: string,
    mediaUrl: string,
    content: string,
  ): Promise<string> {
    const res = await fetch(`${GRAPH}/${pageId}/photos?access_token=${pageToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: mediaUrl, message: content, published: true }),
    });
    const json = (await res.json()) as {
      id?: string;
      post_id?: string;
      error?: { message?: string };
    };
    if (!res.ok || !json.id) {
      throw new Error(json.error?.message ?? 'Facebook photo post failed');
    }
    return json.post_id ?? json.id;
  }

  private async publishCarousel(
    pageId: string,
    pageToken: string,
    mediaUrls: string[],
    content: string,
  ): Promise<string> {
    const uploadedPhotos = await Promise.all(
      mediaUrls.map(async (url) => {
        const res = await fetch(`${GRAPH}/${pageId}/photos?access_token=${pageToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, published: false }),
        });
        const json = (await res.json()) as { id?: string; error?: { message?: string } };
        if (!res.ok || !json.id) {
          throw new Error(json.error?.message ?? 'Facebook photo upload failed');
        }
        return { media_fbid: json.id };
      }),
    );

    const res = await fetch(`${GRAPH}/${pageId}/feed?fields=id&access_token=${pageToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: content,
        attached_media: uploadedPhotos,
        published: true,
      }),
    });
    const json = (await res.json()) as { id?: string; error?: { message?: string } };
    if (!res.ok || !json.id) {
      throw new Error(json.error?.message ?? 'Facebook carousel post failed');
    }
    return json.id;
  }

  private async publishVideo(
    pageId: string,
    pageToken: string,
    videoUrl: string,
    content: string,
  ): Promise<string> {
    const res = await fetch(
      `${GRAPH}/${pageId}/videos?fields=id&access_token=${pageToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: videoUrl,
          description: content,
          published: true,
        }),
      },
    );
    const json = (await res.json()) as { id?: string; error?: { message?: string } };
    if (!res.ok || !json.id) {
      throw new Error(json.error?.message ?? 'Facebook video upload failed');
    }
    return json.id;
  }

  private toStringArray(value: unknown) {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }
}
