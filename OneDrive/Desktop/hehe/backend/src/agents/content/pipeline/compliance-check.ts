import { BrandContext } from '../../../brand/brand.service';
import { PlatformDraft, ComplianceResult, PlatformCharLimits } from '../types';

export const PLATFORM_CHAR_LIMITS: PlatformCharLimits = {
  twitter: 280,
  instagram: 200,
  linkedin: 300,
  facebook: 250,
  tiktok: 150,
};

export function validateCharLimits(draft: PlatformDraft): {
  passed: boolean;
  violations: string[];
  trimmedCaption?: string;
} {
  const limit = PLATFORM_CHAR_LIMITS[draft.platform as keyof PlatformCharLimits];
  if (!limit) {
    return { passed: true, violations: [] };
  }

  if (draft.fullCaption.length <= limit) {
    return { passed: true, violations: [] };
  }

  let trimmed = draft.fullCaption;
  const violations: string[] = [];

  const hashtagStr = draft.hashtags.map((h) => `#${h}`).join(' ');
  if (hashtagStr.length > 0 && trimmed.includes(hashtagStr)) {
    trimmed = trimmed.replace(hashtagStr, '').trim();
    if (trimmed.endsWith('\n') || trimmed.endsWith(' ')) {
      trimmed = trimmed.trimEnd();
    }
  }

  if (trimmed.length > limit) {
    const overBy = trimmed.length - limit;
    const words = trimmed.split(' ');
    const cutoffIdx = Math.max(0, words.length - Math.ceil(overBy / 5) - 3);
    trimmed = words.slice(0, cutoffIdx).join(' ');
    if (hashtagStr) {
      trimmed = trimmed.trimEnd() + ' ' + hashtagStr;
    }
  }

  if (trimmed.length > limit) {
    trimmed = trimmed.substring(0, limit);
  }

  if (trimmed.length > limit) {
    violations.push(`Caption exceeds ${limit} chars (${draft.fullCaption.length} chars) and could not be fully trimmed`);
  }

  return {
    passed: violations.length === 0,
    violations,
    trimmedCaption: trimmed,
  };
}

export function checkCompliance(
  draft: PlatformDraft,
  brand: BrandContext,
): ComplianceResult {
  const violations: string[] = [];
  let caption = draft.fullCaption;

  const lowerCaption = caption.toLowerCase();

  for (const word of brand.voice.neverWords) {
    if (lowerCaption.includes(word.toLowerCase())) {
      violations.push(`Contains banned word: "${word}"`);
      const regex = new RegExp(word, 'gi');
      caption = caption.replace(regex, '___');
    }
  }

  const missingAlways: string[] = [];
  for (const word of brand.voice.alwaysWords) {
    if (!lowerCaption.includes(word.toLowerCase())) {
      missingAlways.push(word);
    }
  }
  if (missingAlways.length > 0 && brand.voice.alwaysWords.length > 0) {
    violations.push(
      `Missing preferred words: ${missingAlways.join(', ')} (consider incorporating)`,
    );
  }

  const charLimitResult = validateCharLimits(draft);
  violations.push(...charLimitResult.violations);
  if (charLimitResult.trimmedCaption && violations.some((v) => v.startsWith('Caption exceeds'))) {
    const existingCorrected = violations.length > 0 && caption !== draft.fullCaption ? caption : undefined;
    return {
      passed: violations.length === 0,
      violations,
      correctedCaption: charLimitResult.trimmedCaption,
    };
  }

  return {
    passed: violations.length === 0,
    violations,
    correctedCaption: violations.length > 0 ? caption : undefined,
  };
}