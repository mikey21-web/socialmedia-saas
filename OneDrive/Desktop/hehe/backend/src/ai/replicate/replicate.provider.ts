import Replicate from 'replicate';
import { Injectable } from '@nestjs/common';

export interface ReplicateImageOptions {
  prompt?: string;
  width?: number;
  height?: number;
  quality?: 'draft' | 'final';
}

@Injectable()
export class ReplicateProvider {
  private client: Replicate;

  constructor() {
    this.client = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }

  async generateImage(prompt: string, options: ReplicateImageOptions): Promise<Buffer> {
    const output = await this.client.run(
      'black-forest-labs/flux-schnell',  // fast, cheap. swap to flux-dev for quality
      {
        input: {
          prompt: options.prompt ?? prompt,
          width: options.width ?? 1024,
          height: options.height ?? 1024,
          num_outputs: 1,
          num_inference_steps: options.quality === 'draft' ? 4 : 8,
          guidance_scale: 3.5,
          output_format: 'png',
          output_quality: 90,
          disable_safety_checker: false,
        },
      }
    ) as string[];

    const imageUrl = output[0];
    const response = await fetch(imageUrl);
    return Buffer.from(await response.arrayBuffer());
  }

  async generateMultiple(prompt: string, count: number, options: ReplicateImageOptions): Promise<Buffer[]> {
    const output = await this.client.run(
      'black-forest-labs/flux-schnell',
      {
        input: {
          prompt,
          width: options.width ?? 1024,
          height: options.height ?? 1024,
          num_outputs: Math.min(count, 4),
          num_inference_steps: 4,
          output_format: 'png',
        },
      }
    ) as string[];

    return Promise.all(
      output.map(async (url) => {
        const resp = await fetch(url);
        return Buffer.from(await resp.arrayBuffer());
      })
    );
  }
}
