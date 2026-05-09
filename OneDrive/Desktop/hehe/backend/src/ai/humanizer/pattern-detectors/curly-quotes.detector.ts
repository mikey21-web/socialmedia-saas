import { Detection, PatternDetector } from '../types';

export class CurlyQuotesDetector implements PatternDetector {
  name = 'curly-quotes';
  category = 'style' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    const regex = /[\u201C\u201D\u2018\u2019]/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      d.push({ pattern: 'curly-quotes', startIndex: m.index, endIndex: m.index + 1, match: m[0], severity: 'low', suggestion: 'Replace curly quotes with straight quotes.' });
    }
    return d;
  }

  fix(text: string): string {
    return text
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'");
  }
}
