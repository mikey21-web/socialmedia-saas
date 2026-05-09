import { Detection, PatternDetector } from '../types';

export class FalseRangesDetector implements PatternDetector {
  name = 'false-ranges';
  category = 'content' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    const regex = /\b(?:from|whether) .{3,30} to .{3,30}(?:,|\.|\b)/gi;
    let m: RegExpExecArray | null;
    let count = 0;
    while ((m = regex.exec(text)) !== null) {
      count++;
      if (count > 1) {
        d.push({ pattern: 'false-ranges', startIndex: m.index, endIndex: m.index + m[0].length, match: m[0], severity: 'low', suggestion: 'Multiple "from X to Y" ranges. This is a common AI padding pattern.' });
      }
    }
    return d;
  }

  fix(text: string): string { return text; }
}
