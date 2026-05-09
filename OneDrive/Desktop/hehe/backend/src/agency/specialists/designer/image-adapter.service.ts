import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

export const PLATFORM_DIMENSIONS: Record<string, Record<string, { w: number; h: number }>> = {
  instagram: {
    square: { w: 1080, h: 1080 },
    portrait: { w: 1080, h: 1350 },  // feed default
    landscape: { w: 1080, h: 566 },
    story: { w: 1080, h: 1920 },
  },
  x: {
    landscape: { w: 1600, h: 900 },
    square: { w: 1200, h: 1200 },
  },
  linkedin: {
    landscape: { w: 1200, h: 627 },  // recommended
    square: { w: 1200, h: 1200 },
  },
  facebook: {
    landscape: { w: 1200, h: 630 },
    square: { w: 1080, h: 1080 },
    story: { w: 1080, h: 1920 },
  },
  tiktok: {
    story: { w: 1080, h: 1920 },
  },
};

@Injectable()
export class ImageAdapterService {
  async adaptForPlatform(
    sourceBuffer: Buffer,
    platform: string,
    format: string = 'portrait'
  ): Promise<Buffer> {
    const dims = PLATFORM_DIMENSIONS[platform]?.[format] 
      ?? PLATFORM_DIMENSIONS['instagram']['portrait'];

    return sharp(sourceBuffer)
      .resize(dims.w, dims.h, {
        fit: 'cover',
        position: 'centre',
      })
      .png({ quality: 90 })
      .toBuffer();
  }

  async adaptForAllPlatforms(
    sourceBuffer: Buffer,
    platforms: string[]
  ): Promise<Record<string, Buffer>> {
    const results: Record<string, Buffer> = {};
    for (const platform of platforms) {
      results[platform] = await this.adaptForPlatform(sourceBuffer, platform);
    }
    return results;
  }

  async addTextOverlay(
    buffer: Buffer,
    text: string,
    options: { position: 'top' | 'bottom' | 'center'; color: string; fontSize: number }
  ): Promise<Buffer> {
    const metadata = await sharp(buffer).metadata();
    const svg = `
      <svg width="${metadata.width}" height="${metadata.height}">
        <rect x="0" y="${options.position === 'bottom' ? metadata.height! - 120 : 0}" 
              width="${metadata.width}" height="120" 
              fill="rgba(0,0,0,0.5)"/>
        <text x="50%" y="${options.position === 'bottom' ? metadata.height! - 60 : 60}"
              font-family="Inter, sans-serif"
              font-size="${options.fontSize}"
              fill="${options.color}"
              text-anchor="middle"
              dominant-baseline="middle">${text}</text>
      </svg>`;

    return sharp(buffer)
      .composite([{ input: Buffer.from(svg), blend: 'over' }])
      .png()
      .toBuffer();
  }
}
