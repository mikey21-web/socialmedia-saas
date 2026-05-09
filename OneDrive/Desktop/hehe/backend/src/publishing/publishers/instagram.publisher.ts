import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OauthService } from '../../platforms/oauth.service';

const GRAPH = 'https://graph.facebook.com/v20.0';
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 60;

@Injectable()
export class InstagramPublisher {
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
    const igAccountId = credential.accountId;

    if (!igAccountId) {
      throw new Error('Instagram Business Account ID missing — re-connect your Instagram account');
    }

    const mediaUrls = this.toStringArray(post.mediaUrls);

    if (!mediaUrls.length) {
      throw new Error('Instagram requires at least one media URL');
    }

    let publishedId: string;

    if (mediaUrls.length === 1) {
      const creationId = await this.createMediaContainer(
        igAccountId,
        pageToken,
        mediaUrls[0],
        post.content,
        false,
      );
      await this.pollMediaStatus(creationId, pageToken);
      publishedId = await this.publishContainer(igAccountId, pageToken, creationId);
    } else {
      const creationIds: string[] = [];

      for (const url of mediaUrls) {
        const id = await this.createMediaContainer(igAccountId, pageToken, url, '', true);
        await this.pollMediaStatus(id, pageToken);
        creationIds.push(id);
      }

      const carouselParams = new URLSearchParams({
        media_type: 'CAROUSEL',
        children: creationIds.join(','),
        caption: post.content,
        access_token: pageToken,
      });

      const carouselRes = await fetch(`${GRAPH}/${igAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: carouselParams.toString(),
      });
      const carouselJson = (await carouselRes.json()) as {
        id?: string;
        error?: { message?: string };
      };

      if (!carouselRes.ok || !carouselJson.id) {
        throw new Error(carouselJson.error?.message ?? 'Instagram carousel creation failed');
      }

      await this.pollMediaStatus(carouselJson.id, pageToken);
      publishedId = await this.publishContainer(igAccountId, pageToken, carouselJson.id);
    }

    await this.prisma.postPlatform.updateMany({
      where: { postId, platform: 'instagram' },
      data: { platformPostId: publishedId, status: 'published' },
    });

    return { platformPostId: publishedId };
  }

  private async createMediaContainer(
    igAccountId: string,
    pageToken: string,
    mediaUrl: string,
    caption: string,
    isCarouselItem: boolean,
  ): Promise<string> {
    const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(mediaUrl);
    const params = new URLSearchParams({ access_token: pageToken });

    if (isVideo) {
      params.set('video_url', mediaUrl);
      params.set('media_type', 'REELS');
    } else {
      params.set('image_url', mediaUrl);
    }

    if (isCarouselItem) {
      params.set('is_carousel_item', 'true');
    } else {
      params.set('caption', caption);
    }

    const res = await fetch(`${GRAPH}/${igAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const json = (await res.json()) as { id?: string; error?: { message?: string } };

    if (!res.ok || !json.id) {
      throw new Error(json.error?.message ?? 'Instagram media creation failed');
    }

    return json.id;
  }

  private async publishContainer(
    igAccountId: string,
    pageToken: string,
    creationId: string,
  ): Promise<string> {
    const res = await fetch(`${GRAPH}/${igAccountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: creationId,
        access_token: pageToken,
      }).toString(),
    });
    const json = (await res.json()) as { id?: string; error?: { message?: string } };

    if (!res.ok || !json.id) {
      throw new Error(json.error?.message ?? 'Instagram publish failed');
    }

    return json.id;
  }

  private async pollMediaStatus(creationId: string, pageToken: string): Promise<void> {
    for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
      const res = await fetch(
        `${GRAPH}/${creationId}?fields=status_code&access_token=${pageToken}`,
      );
      const json = (await res.json()) as {
        status_code?: string;
        error?: { message?: string };
      };

      if (json.status_code === 'FINISHED') return;
      if (json.status_code === 'ERROR' || json.status_code === 'EXPIRED') {
        throw new Error(`Instagram media processing failed: ${json.status_code}`);
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
    throw new Error('Instagram media processing timed out');
  }

  private toStringArray(value: unknown) {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }
}
