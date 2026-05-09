import { Detection, PatternDetector } from '../types';

export class ExcessiveBoldDetector implements PatternDetector {
  name = 'excessive-bold';
  category = 'style' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    const bolds = text.match(/\*\*[^*]+\*\*/g) ?? [];
    if (bolds.length > 3) {
      d.push({ pattern: 'excessive-bold', startIndex: 0, endIndex: text.length, match: `${bolds.length} bold segments`, severity: 'medium', suggestion: `${bolds.length} bold segments is excessive. Use 1-2 for emphasis.` });
    }
    return d;
  }

  fix(text: string): string {
    const bolds = text.match(/\*\*[^*]+\*\*/g) ?? [];
    if (bolds.length <= 3) return text;
    let r = text;
    for (let i = 3; i < bolds.length; i++) {
      const inner = bolds[i].replace(/\*\*/g, '');
      r = r.replace(bolds[i], inner);
    }
    return r;
  }
}
