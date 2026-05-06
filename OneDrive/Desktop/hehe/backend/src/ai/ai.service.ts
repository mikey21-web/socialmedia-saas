import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';

export interface GenerateCaptionDto {
  topic: string;
  platforms: string[];
  tone?: 'professional' | 'casual' | 'funny' | 'inspirational';
}

export interface GeneratedCaption {
  content: string;
  hashtags: string[];
}

@Injectable()
export class AiService {
  private readonly client: Groq;

  constructor() {
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  async generateCaption(dto: GenerateCaptionDto): Promise<GeneratedCaption> {
    const { topic, platforms, tone = 'professional' } = dto;

    const platformList = platforms.join(', ');
    const prompt = `Generate a social media post caption for the following:

Topic: ${topic}
Platforms: ${platformList}
Tone: ${tone}

Requirements:
- Write an engaging caption optimized for ${platformList}
- Keep it under 280 characters if Twitter/X is included
- Include 3-5 relevant hashtags
- Match the specified tone exactly
- No preamble, no explanation — just the post content

Respond with JSON in this exact format:
{"content": "the caption text without hashtags", "hashtags": ["hashtag1", "hashtag2", "hashtag3"]}`;

    const completion = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 512,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(text) as GeneratedCaption;
    return parsed;
  }
}
