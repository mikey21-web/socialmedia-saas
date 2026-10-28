import { PLATFORMS } from './types';
import type { Platform, Tone } from './types';

const TONES: Tone[] = ['professional', 'casual', 'funny', 'inspirational', 'bold'];

export function parsePlatforms(value: unknown): Platform[] {
  if (!Array.isArray(value)) return [];
  const output: Platform[] = [];
  for (const item of value) {
    const platform = String(item).toLowerCase() as Platform;
    if ((PLATFORMS as readonly string[]).includes(platform) && !output.includes(platform)) {
      output.push(platform);
    }
  }
  return output;
}

export function parseTone(value: unknown): Tone | undefined {
  const tone = String(value ?? '').toLowerCase() as Tone;
  return TONES.includes(tone) ? tone : undefined;
}

export function parseCount(value: unknown, fallback = 3): number {
  const count = Number(value);
  if (!Number.isFinite(count)) return fallback;
  return Math.min(Math.max(Math.round(count), 1), 10);
}

export function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export function parseHashtags(value: unknown): string[] {
  if (typeof value === 'string') {
    return value
      .split(/[\s,]+/)
      .map((tag) => tag.replace(/^#+/, '').trim())
      .filter(Boolean)
      .slice(0, 10);
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((tag) => String(tag).replace(/^#+/, '').trim())
    .filter(Boolean)
    .slice(0, 10);
}

export function cleanText(value: unknown, max = 10000): string {
  return String(value ?? '').trim().slice(0, max);
}
