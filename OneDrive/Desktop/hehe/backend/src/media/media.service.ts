import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Prisma } from '@prisma/client';
import Replicate from 'replicate';
import { PrismaService } from '../prisma/prisma.service';
import { HyperframesService } from './hyperframes.service';
import { assertSsrfSafe } from '../common/ssrf-guard';

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_REMOTE_DOWNLOAD_BYTES = 50 * 1024 * 1024; // 50 MB cap for remote URL fetches

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export type SaveAssetInput = {
  url: string;
  filename: string;
  mimeType: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  source?: string;
  tags?: string[];
};

export type ListAssetsParams = {
  source?: string;
  tag?: string;
  page?: number;
  limit?: number;
};

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly replicate: Replicate | null;
  private readonly s3Client: S3Client;
  private readonly awsRegion: string | undefined;
  private readonly awsBucket: string | undefined;
  private readonly awsBaseUrl: string | undefined;
  private readonly awsConfigured: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly hyperframesService: HyperframesService,
  ) {
    const token = process.env.REPLICATE_API_TOKEN;
    this.replicate = token ? new Replicate({ auth: token }) : null;

    this.awsRegion = process.env.AWS_REGION;

    // Support R2_BUCKET, S3_BUCKET, AWS_S3_BUCKET, or S3_BUCKET_NAME — never hardcoded
    this.awsBucket =
      process.env.R2_BUCKET ??
      process.env.S3_BUCKET ??
      process.env.AWS_S3_BUCKET ??
      process.env.S3_BUCKET_NAME;

    // Public CDN URL: prefer CDN_URL / R2_PUBLIC_URL, fall back to AWS_S3_BASE_URL
    this.awsBaseUrl =
      process.env.CDN_URL ??
      process.env.R2_PUBLIC_URL ??
      process.env.AWS_S3_BASE_URL;

    this.awsConfigured = Boolean(
      process.env.AWS_REGION
      && process.env.AWS_ACCESS_KEY_ID
      && process.env.AWS_SECRET_ACCESS_KEY
      && this.awsBucket,
    );

    this.s3Client = new S3Client({
      region: this.awsRegion,
      // R2 requires a custom endpoint; fall back to standard AWS if not provided
      ...(process.env.R2_ENDPOINT ? { endpoint: process.env.R2_ENDPOINT } : {}),
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
        : undefined,
    });

    if (!this.awsConfigured) {
      this.logger.warn('AWS S3/R2 not fully configured — media upload unavailable');
    }
  }

  validateMimeType(mimeType: string): void {
    const allowed = ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
    if (!allowed) throw new BadRequestException(`Unsupported file type: ${mimeType}. Allowed: image/*, video/*, application/pdf`);
  }

  validateFileSize(size: number): void {
    if (size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(`File exceeds the 100 MB size limit (received ${Math.round(size / 1024 / 1024)} MB)`);
    }
  }

  async uploadToS3(file: UploadedFile, teamId?: string): Promise<string> {
    if (!this.awsConfigured || !this.awsBucket || !this.awsRegion) {
      throw new BadRequestException('S3/R2 not configured');
    }

    const prefix = teamId ? `uploads/${teamId}` : 'uploads/unknown';
    const key = `${prefix}/${Date.now()}-${this.sanitizeFilename(file.originalname)}`;

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.awsBucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    }));

    const baseUrl = this.awsBaseUrl ?? `https://${this.awsBucket}.s3.${this.awsRegion}.amazonaws.com`;
    return `${baseUrl}/${key}`;
  }

  async uploadFile(teamId: string, file: UploadedFile) {
    this.validateMimeType(file.mimetype);
    this.validateFileSize(file.size);
    const url = await this.uploadToS3(file, teamId);
    const asset = await this.saveAsset(teamId, {
      url,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      source: 'upload',
      tags: [],
    });

    return { url, asset };
  }

  async generateImage(teamId: string, prompt: string) {
    if (!this.replicate) throw new BadRequestException('REPLICATE_API_TOKEN not configured');

    this.logger.log(`Generating image: "${prompt.slice(0, 60)}..."`);
    const output = await this.replicate.run(
      'black-forest-labs/flux-schnell',
      { input: { prompt, num_outputs: 1 } },
    ) as string[];

    const url = output?.[0];
    if (!url) throw new BadRequestException('Replicate returned no output');

    const asset = await this.saveAsset(teamId, {
      url,
      filename: this.deriveFilenameFromUrl(url, 'generated-image'),
      mimeType: 'image/png',
      source: 'generated',
      tags: ['ai-generated'],
    });

    return { url, asset };
  }

  async generateVideo(teamId: string, prompt: string, duration = 5) {
    if (!this.replicate) throw new BadRequestException('REPLICATE_API_TOKEN not configured');

    const output = await this.replicate.run('minimax/video-01', {
      input: { prompt, duration },
    });

    const url = Array.isArray(output) ? String(output[0]) : String(output);
    const asset = await this.saveAsset(teamId, {
      url,
      filename: this.deriveFilenameFromUrl(url, 'generated-video'),
      mimeType: 'video/mp4',
      source: 'generated',
      tags: ['ai-generated'],
    });

    return { url, asset };
  }

  async saveAsset(teamId: string, input: SaveAssetInput) {
    return this.prisma.mediaAsset.create({
      data: {
        teamId,
        url: input.url,
        filename: input.filename,
        mimeType: input.mimeType,
        size: input.size ?? 0,
        width: input.width ?? null,
        height: input.height ?? null,
        source: input.source ?? 'upload',
        tags: input.tags ?? [],
      },
    });
  }

  async listAssets(teamId: string, params: ListAssetsParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 24;

    const where: Prisma.MediaAssetWhereInput = {
      teamId,
      ...(params.source ? { source: params.source } : {}),
      ...(params.tag ? { tags: { has: params.tag } } : {}),
    };

    const [assets, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    return {
      assets,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  async deleteAsset(teamId: string, id: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, teamId },
    });

    if (!asset) {
      throw new NotFoundException('Media asset not found');
    }

    const objectKey = this.getS3ObjectKey(asset.url);
    if (objectKey && this.awsBucket) {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.awsBucket,
        Key: objectKey,
      }));
    }

    await this.prisma.mediaAsset.delete({ where: { id: asset.id } });
    return { success: true };
  }

  async addTag(teamId: string, id: string, tag: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, teamId },
    });

    if (!asset) {
      throw new NotFoundException('Media asset not found');
    }

    const normalizedTag = tag.trim();
    if (!normalizedTag) {
      throw new BadRequestException('tag is required');
    }

    if (asset.tags.includes(normalizedTag)) {
      return asset;
    }

    return this.prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { tags: [...asset.tags, normalizedTag] },
    });
  }

  async removeTag(teamId: string, id: string, tag: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, teamId },
    });

    if (!asset) {
      throw new NotFoundException('Media asset not found');
    }

    return this.prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { tags: asset.tags.filter((existingTag) => existingTag !== tag) },
    });
  }

  async heygenAvatars(teamId: string) {
    const apiKey = await this.resolveHeygenApiKey(teamId);
    const { HeygenProvider } = await import('../thirdparty/heygen/heygen.provider');
    const provider = new HeygenProvider();
    return provider.avatars(apiKey);
  }

  async heygenVoices(teamId: string) {
    const apiKey = await this.resolveHeygenApiKey(teamId);
    const { HeygenProvider } = await import('../thirdparty/heygen/heygen.provider');
    const provider = new HeygenProvider();
    return provider.voices(apiKey);
  }

  async heygenStart(
    teamId: string,
    input: {
      script: string;
      avatarId: string;
      voiceId: string;
      type: 'avatar' | 'talking_photo';
      aspectRatio: 'landscape' | 'story';
      captions: boolean;
    },
  ) {
    const apiKey = await this.resolveHeygenApiKey(teamId);
    const { HeygenProvider } = await import('../thirdparty/heygen/heygen.provider');
    const provider = new HeygenProvider();
    const videoId = await provider.startVideo(apiKey, {
      voice: input.script,
      avatar: input.avatarId,
      aspect_ratio: input.aspectRatio,
      captions: input.captions ? 'yes' : 'no',
      selectedVoice: input.voiceId,
      type: input.type,
    });
    return { jobId: videoId };
  }

  async heygenCheckStatus(teamId: string, videoId: string) {
    const apiKey = await this.resolveHeygenApiKey(teamId);
    const { HeygenProvider } = await import('../thirdparty/heygen/heygen.provider');
    const provider = new HeygenProvider();
    const result = await provider.checkVideoStatus(apiKey, videoId);

    if (result.status === 'completed' && result.url) {
      const asset = await this.saveAsset(teamId, {
        url: result.url,
        filename: `heygen-avatar-${Date.now()}.mp4`,
        mimeType: 'video/mp4',
        source: 'generated',
        tags: ['ai-generated', 'heygen', 'avatar-video'],
      });
      return { status: 'completed', url: result.url, asset };
    }

    return { status: result.status };
  }

  async heygenGenerate(
    teamId: string,
    input: {
      script: string;
      avatarId: string;
      voiceId: string;
      type: 'avatar' | 'talking_photo';
      aspectRatio: 'landscape' | 'story';
      captions: boolean;
    },
  ) {
    const apiKey = await this.resolveHeygenApiKey(teamId);
    const { HeygenProvider } = await import('../thirdparty/heygen/heygen.provider');
    const provider = new HeygenProvider();

    const videoUrl = await provider.sendData(apiKey, {
      voice: input.script,
      avatar: input.avatarId,
      aspect_ratio: input.aspectRatio,
      captions: input.captions ? 'yes' : 'no',
      selectedVoice: input.voiceId,
      type: input.type,
    });

    const asset = await this.saveAsset(teamId, {
      url: videoUrl,
      filename: `heygen-avatar-${Date.now()}.mp4`,
      mimeType: 'video/mp4',
      source: 'generated',
      tags: ['ai-generated', 'heygen', 'avatar-video'],
    });

    return { url: videoUrl, asset };
  }

  async renderHyperframe(
    teamId: string,
    templateId: string,
    data: Record<string, string>,
    format: 'story' | 'square' | 'landscape',
  ) {
    const buffer = await this.hyperframesService.render(
      templateId as 'quote-card' | 'announcement' | 'stat-card' | 'product-showcase',
      data as unknown as {
        quote?: string;
        author?: string;
        headline?: string;
        subtext?: string;
        badge?: string;
        metric?: string;
        label?: string;
        context?: string;
        productName?: string;
        tagline?: string;
        cta?: string;
        bgColor?: string;
        accentColor?: string;
      },
      format,
    );

    const filename = `animated-${templateId}-${Date.now()}.mp4`;
    const url = await this.uploadBuffer(teamId, buffer, filename, 'video/mp4');

    const asset = await this.saveAsset(teamId, {
      url,
      filename,
      mimeType: 'video/mp4',
      source: 'generated',
      tags: ['ai-generated', 'hyperframes', 'animated-card'],
    });

    return { url, asset };
  }

  async uploadGeneratedBuffer(
    teamId: string,
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<string> {
    return this.uploadBuffer(teamId, buffer, filename, mimeType);
  }

  private async resolveHeygenApiKey(teamId: string): Promise<string> {
    const integration = await this.prisma.thirdPartyIntegration.findFirst({
      where: { teamId, type: 'heygen', enabled: true },
    });

    if (!integration?.apiKey) {
      throw new BadRequestException(
        "HeyGen not connected. Go to Settings > Connections to add your API key.",
      );
    }

    return integration.apiKey;
  }

  private async uploadBuffer(
    teamId: string,
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<string> {
    if (!this.awsConfigured || !this.awsBucket || !this.awsRegion) {
      throw new BadRequestException('S3/R2 not configured');
    }

    const prefix = `uploads/${teamId}`;
    const key = `${prefix}/${Date.now()}-${this.sanitizeFilename(filename)}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.awsBucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ACL: 'public-read',
      }),
    );

    const baseUrl = this.awsBaseUrl ?? `https://${this.awsBucket}.s3.${this.awsRegion}.amazonaws.com`;
    return `${baseUrl}/${key}`;
  }

  /**
   * Fetch a remote URL and return its contents as a Buffer, capped at 50 MB.
   * Throws BadRequestException if the remote resource exceeds the limit.
   */
  async fetchRemoteWithSizeCap(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    await assertSsrfSafe(url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new BadRequestException(`Remote fetch failed: HTTP ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_REMOTE_DOWNLOAD_BYTES) {
      throw new BadRequestException(
        `Remote resource exceeds the 50 MB size limit (content-length: ${contentLength})`,
      );
    }

    const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? 'application/octet-stream';

    const reader = response.body?.getReader();
    if (!reader) {
      throw new BadRequestException('Remote response has no body');
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.length;
        if (totalBytes > MAX_REMOTE_DOWNLOAD_BYTES) {
          reader.cancel().catch(() => undefined);
          throw new BadRequestException('Remote resource exceeds the 50 MB size limit');
        }
        chunks.push(value);
      }
    }

    const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    return { buffer, mimeType };
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private deriveFilenameFromUrl(url: string, fallback: string) {
    try {
      const parsedUrl = new URL(url);
      const filename = parsedUrl.pathname.split('/').filter(Boolean).pop();
      return filename ? this.sanitizeFilename(filename) : `${fallback}-${Date.now()}`;
    } catch {
      return `${fallback}-${Date.now()}`;
    }
  }

  private getS3ObjectKey(url: string) {
    try {
      const parsedUrl = new URL(url);
      const baseUrl = this.awsBaseUrl ? new URL(this.awsBaseUrl) : null;

      if (baseUrl && parsedUrl.host === baseUrl.host) {
        return parsedUrl.pathname.replace(/^\/+/, '');
      }

      if (this.awsBucket && parsedUrl.hostname.startsWith(`${this.awsBucket}.s3.`)) {
        return parsedUrl.pathname.replace(/^\/+/, '');
      }

      return null;
    } catch {
      return null;
    }
  }
}
