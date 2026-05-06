import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Prisma } from '@prisma/client';
import Replicate from 'replicate';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];

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

  constructor(private readonly prisma: PrismaService) {
    const token = process.env.REPLICATE_API_TOKEN;
    this.replicate = token ? new Replicate({ auth: token }) : null;

    this.awsRegion = process.env.AWS_REGION;
    this.awsBucket = process.env.AWS_S3_BUCKET ?? process.env.S3_BUCKET_NAME;
    this.awsBaseUrl = process.env.AWS_S3_BASE_URL;

    this.awsConfigured = Boolean(
      process.env.AWS_REGION
      && process.env.AWS_ACCESS_KEY_ID
      && process.env.AWS_SECRET_ACCESS_KEY
      && this.awsBucket,
    );

    this.s3Client = new S3Client({
      region: this.awsRegion,
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
        : undefined,
    });

    if (!this.awsConfigured) {
      this.logger.warn('AWS S3 not fully configured — media upload unavailable');
    }
  }

  validateMimeType(mimeType: string): void {
    const allowed = ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
    if (!allowed) throw new BadRequestException(`Unsupported file type: ${mimeType}`);
  }

  async uploadToS3(file: UploadedFile): Promise<string> {
    if (!this.awsConfigured || !this.awsBucket || !this.awsRegion) {
      throw new BadRequestException('S3 not configured');
    }

    const key = `uploads/${Date.now()}-${this.sanitizeFilename(file.originalname)}`;

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
    const url = await this.uploadToS3(file);
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
