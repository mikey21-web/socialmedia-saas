import { Detection, PatternDetector } from '../types';

export class RuleOfThreeDetector implements PatternDetector {
  name = 'rule-of-three';
  category = 'style' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    const regex = /\b(\w+), (\w+),? and (\w+)\b/gi;
    let m: RegExpExecArray | null;
    let count = 0;
    while ((m = regex.exec(text)) !== null) {
      count++;
      if (count > 2) {
        d.push({ pattern: 'rule-of-three', startIndex: m.index, endIndex: m.index + m[0].length, match: m[0], severity: 'low', suggestion: 'Multiple "X, Y, and Z" triplets. Vary your list structures.' });
      }
    }
    return d;
  }

  fix(text: string): string { return text; }
}
