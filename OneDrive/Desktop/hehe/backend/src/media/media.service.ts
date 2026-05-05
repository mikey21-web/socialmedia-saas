import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import Replicate from 'replicate';

const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  validateMimeType(mimeType: string): void {
    const allowed = ALLOWED_MIME_PREFIXES.some((prefix) =>
      mimeType.startsWith(prefix),
    );
    if (!allowed) {
      throw new BadRequestException(`Unsupported file type: ${mimeType}`);
    }
  }

  async generateImage(prompt: string): Promise<string> {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new BadRequestException('REPLICATE_API_TOKEN not configured');
    }

    const replicate = new Replicate({ auth: token });

    this.logger.log(`Generating image for prompt: "${prompt.slice(0, 60)}..."`);

    const output = await replicate.run(
      'black-forest-labs/flux-schnell',
      { input: { prompt, num_outputs: 1 } },
    ) as string[];

    if (!output || !output[0]) {
      throw new BadRequestException('Replicate returned no output');
    }

    return output[0];
  }
}
