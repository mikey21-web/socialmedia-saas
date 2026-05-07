import { Injectable } from '@nestjs/common';
import { OauthService } from '../../platforms/oauth.service';
import { PrismaService } from '../../prisma/prisma.service';

const LINKEDIN_HEADERS = {
  'LinkedIn-Version': '202601',
  'X-Restli-Protocol-Version': '2.0.0',
  'Content-Type': 'application/json',
};

@Injectable()
export class LinkedinPublisher {
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
    const author = credential.accountId?.startsWith('urn:')
      ? credential.accountId
      : `urn:li:person:${credential.accountId ?? await this.getPersonId(accessToken)}`;
    const mediaUrns: string[] = [];

    for (const mediaUrl of this.toStringArray(post.mediaUrls)) {
      mediaUrns.push(await this.uploadImage(accessToken, author, mediaUrl));
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: { ...LINKEDIN_HEADERS, Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: post.content },
            shareMediaCategory: mediaUrns.length ? 'IMAGE' : 'NONE',
            ...(mediaUrns.length
              ? {
                  media: mediaUrns.map((urn) => ({
                    status: 'READY',
                    media: urn,
                  })),
                }
              : {}),
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });

    const payload = await this.readJson(response);
    if (!response.ok) {
      throw new Error(this.extractError(payload, 'LinkedIn publish failed'));
    }

    const platformPostId = response.headers.get('x-restli-id') ?? this.extractString(payload, 'id');
    if (!platformPostId) throw new Error('LinkedIn response did not include a post id');

    await this.prisma.postPlatform.updateMany({
      where: { postId, platform: 'linkedin' },
      data: { platformPostId, status: 'published' },
    });

    return { platformPostId };
  }

  private async getPersonId(accessToken: string) {
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payload = await this.readJson(response);
    const sub = this.extractString(payload, 'sub');
    if (!sub) throw new Error('LinkedIn profile id not found');
    return sub;
  }

  private async uploadImage(accessToken: string, owner: string, mediaUrl: string) {
    const registerResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
      method: 'POST',
      headers: { ...LINKEDIN_HEADERS, Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      }),
    });
    const registerPayload = await this.readJson(registerResponse);
    if (!registerResponse.ok) {
      throw new Error(this.extractError(registerPayload, 'LinkedIn media registration failed'));
    }

    const uploadMechanism = this.extractUploadMechanism(registerPayload);
    const asset = this.extractNestedString(registerPayload, ['value', 'asset']);
    if (!uploadMechanism || !asset) {
      throw new Error('LinkedIn media upload details missing');
    }

    const mediaResponse = await fetch(mediaUrl);
    await fetch(uploadMechanism, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: Buffer.from(await mediaResponse.arrayBuffer()),
    });
    return asset;
  }

  private extractUploadMechanism(payload: Record<string, unknown>) {
    return this.extractNestedString(payload, [
      'value',
      'uploadMechanism',
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest',
      'uploadUrl',
    ]);
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
    return this.extractString(payload, 'message') ?? this.extractString(payload, 'error') ?? fallback;
  }
}
