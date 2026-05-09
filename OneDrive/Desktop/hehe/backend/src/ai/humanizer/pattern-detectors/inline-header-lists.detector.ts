import { Detection, PatternDetector } from '../types';

export class InlineHeaderListsDetector implements PatternDetector {
  name = 'inline-header-lists';
  category = 'style' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    const regex = /^\s*\*?\*?(?:\d+\.|[-*])\s+\*?\*?[A-Z][^:]+:\*?\*?\s/gm;
    let m: RegExpExecArray | null;
    let count = 0;
    while ((m = regex.exec(text)) !== null) {
      count++;
    }
    if (count >= 3) {
      d.push({ pattern: 'inline-header-lists', startIndex: 0, endIndex: text.length, match: `${count} header-list items`, severity: 'medium', suggestion: 'Header-colon list format is a strong AI tell. Use varied paragraph structure.' });
    }
    return d;
  }

  fix(text: string): string { return text; }
}
