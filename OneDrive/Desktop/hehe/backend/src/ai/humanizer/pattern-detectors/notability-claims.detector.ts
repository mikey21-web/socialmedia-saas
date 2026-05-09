import { Detection, PatternDetector } from '../types';

const PATTERNS = [
  /\b(?:notably|significantly|importantly|crucially|fundamentally)\b/gi,
  /\b(?:it is (?:widely|commonly|generally) (?:known|accepted|recognized))\b/gi,
  /\b(?:experts agree|research shows|studies show)\b/gi,
];

export class NotabilityClaimsDetector implements PatternDetector {
  name = 'notability-claims';
  category = 'content' as const;

  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    for (const regex of PATTERNS) {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        detections.push({
          pattern: 'notability-claims',
          startIndex: m.index, endIndex: m.index + m[0].length,
          match: m[0], severity: 'medium',
          suggestion: 'Remove vague notability claim or cite a specific source.',
        });
      }
    }
    return detections;
  }

  fix(text: string): string {
    let r = text;
    r = r.replace(/\b(?:notably|significantly|importantly|crucially|fundamentally),?\s*/gi, '');
    r = r.replace(/\s{2,}/g, ' ');
    return r.trim();
  }
}
