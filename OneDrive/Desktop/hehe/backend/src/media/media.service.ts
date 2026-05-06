import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import Replicate from 'replicate';

const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly replicate: Replicate | null;
  private readonly s3Client: S3Client;
  private readonly awsRegion: string | undefined;
  private readonly awsBucket: string | undefined;
  private readonly awsBaseUrl: string | undefined;
  private readonly awsConfigured: boolean;

  constructor() {
    const token = process.env.REPLICATE_API_TOKEN;
    this.replicate = token ? new Replicate({ auth: token }) : null;

    this.awsRegion = process.env.AWS_REGION;
    this.awsBucket = process.env.AWS_S3_BUCKET;
    this.awsBaseUrl = process.env.AWS_S3_BASE_URL;

    this.awsConfigured = Boolean(
      process.env.AWS_REGION
      && process.env.AWS_ACCESS_KEY_ID
      && process.env.AWS_SECRET_ACCESS_KEY
      && process.env.AWS_S3_BUCKET,
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

  async generateImage(prompt: string): Promise<string> {
    if (!this.replicate) throw new BadRequestException('REPLICATE_API_TOKEN not configured');

    this.logger.log(`Generating image: "${prompt.slice(0, 60)}..."`);
    const output = await this.replicate.run(
      'black-forest-labs/flux-schnell',
      { input: { prompt, num_outputs: 1 } },
    ) as string[];

    if (!output?.[0]) throw new BadRequestException('Replicate returned no output');
    return output[0];
  }

  async generateVideo(prompt: string, duration = 5): Promise<string> {
    if (!this.replicate) throw new BadRequestException('REPLICATE_API_TOKEN not configured');

    const output = await this.replicate.run('minimax/video-01', {
      input: { prompt, duration },
    });

    return Array.isArray(output) ? String(output[0]) : String(output);
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}
