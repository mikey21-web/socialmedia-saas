import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import * as fs from 'fs';

@Injectable()
export class R2StorageService {
  private client: S3Client;
  private bucket = process.env.R2_BUCKET_NAME!;
  private publicUrl = process.env.R2_PUBLIC_URL!;

  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    contentType = 'image/png'
  ): Promise<string> {
    if (!process.env.R2_ACCOUNT_ID) {
      // Local fallback for development
      // Ensure directory exists
      if (!fs.existsSync('./uploads')) {
        fs.mkdirSync('./uploads', { recursive: true });
      }
      const path = `./uploads/${fileName}`;
      await fs.promises.writeFile(path, buffer);
      return `/uploads/${fileName}`;
    }

    const key = `uploads/${nanoid()}/${fileName}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return `${this.publicUrl}/${key}`;
  }

  async uploadBase64(
    base64: string,
    fileName: string,
    contentType = 'image/png'
  ): Promise<string> {
    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    return this.uploadBuffer(buffer, fileName, contentType);
  }
}
