import { Detection, PatternDetector } from '../types';

export class TitleCaseHeadingsDetector implements PatternDetector {
  name = 'title-case-headings';
  category = 'style' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    const regex = /^#+\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){2,})/gm;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      d.push({ pattern: 'title-case-headings', startIndex: m.index, endIndex: m.index + m[0].length, match: m[0], severity: 'low', suggestion: 'Title Case Headings are an AI marker. Use sentence case.' });
    }
    return d;
  }

  fix(text: string): string {
    return text.replace(/^(#+\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){2,})/gm, (_match, hashes: string, title: string) => {
      const words = title.split(' ');
      const sentence = words.map((w, i) => i === 0 ? w : w.toLowerCase()).join(' ');
      return `${hashes}${sentence}`;
    });
  }
}
