import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface LLMClient {
  complete(prompt: string, opts?: LLMOptions): Promise<string>;
  completeJson<T>(prompt: string, opts?: LLMOptions): Promise<T>;
}

@Injectable()
export class LlmService implements LLMClient {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: Groq;
  private readonly defaultModel = 'llama-3.3-70b-versatile';

  constructor() {
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder' });
  }

  async complete(prompt: string, opts?: LLMOptions): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: opts?.model ?? this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 1024,
    });

    return completion.choices[0]?.message?.content ?? '';
  }

  async completeJson<T>(prompt: string, opts?: LLMOptions): Promise<T> {
    const completion = await this.client.chat.completions.create({
      model: opts?.model ?? this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 2048,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices[0]?.message?.content ?? '{}';
    try {
      return JSON.parse(text) as T;
    } catch (err) {
      this.logger.error(`Failed to parse LLM JSON response: ${text}`);
      throw err;
    }
  }
}
