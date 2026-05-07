import { BrandContext } from '../../../brand/brand.service';
import { PlatformDraft, ComplianceResult } from '../types';

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

  return {
    passed: violations.length === 0,
    violations,
    correctedCaption: violations.length > 0 ? caption : undefined,
  };
}
