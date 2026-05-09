import { Detection, PatternDetector } from '../types';

const PROMO_WORDS = [
  'unlock', 'supercharge', 'skyrocket', 'turbocharge', 'maximize',
  'amplify', 'dominate', 'crush it', 'level up', 'hack',
  'secret', 'ultimate', 'proven', 'guaranteed', 'exclusive',
];

export class PromotionalLanguageDetector implements PatternDetector {
  name = 'promotional-language';
  category = 'content' as const;

  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    for (const word of PROMO_WORDS) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        detections.push({
          pattern: 'promotional-language',
          startIndex: m.index, endIndex: m.index + m[0].length,
          match: m[0], severity: 'medium',
          suggestion: `"${m[0]}" sounds like clickbait. Use a more honest claim.`,
        });
      }
    }
    return detections;
  }

  fix(text: string): string {
    let r = text;
    const map: Record<string, string> = {
      'unlock': 'get access to', 'supercharge': 'speed up', 'skyrocket': 'grow',
      'turbocharge': 'improve', 'maximize': 'get more from', 'amplify': 'spread',
      'dominate': 'do well in', 'crush it': 'do great', 'level up': 'improve',
      'hack': 'tip', 'secret': 'tip', 'ultimate': 'thorough', 'proven': 'tested',
      'guaranteed': 'likely', 'exclusive': 'limited',
    };
    for (const [k, v] of Object.entries(map)) {
      r = r.replace(new RegExp(`\\b${k}\\b`, 'gi'), v);
    }
    return r;
  }
}
