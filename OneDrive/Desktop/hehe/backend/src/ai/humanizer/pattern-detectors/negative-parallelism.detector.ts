import { Detection, PatternDetector } from '../types';

export class NegativeParallelismDetector implements PatternDetector {
  name = 'negative-parallelism';
  category = 'language' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    const regex = /\b(?:not just .{3,40}, but (?:also )?)/gi;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      d.push({ pattern: 'negative-parallelism', startIndex: m.index, endIndex: m.index + m[0].length, match: m[0], severity: 'low', suggestion: '"Not just X, but also Y" is a formulaic AI structure. Rephrase.' });
    }
    return d;
  }

  fix(text: string): string { return text; }
}
