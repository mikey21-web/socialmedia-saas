import { Detection, PatternDetector } from '../types';

export class FormulaicChallengesDetector implements PatternDetector {
  name = 'formulaic-challenges';
  category = 'content' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    const patterns = [
      /\b(?:the challenge (?:lies|remains) in)\b/gi,
      /\b(?:striking (?:a|the) (?:right )?balance between)\b/gi,
      /\b(?:while .{5,40}, (?:it is|it's) (?:also|equally) important)\b/gi,
    ];
    for (const regex of patterns) {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        d.push({ pattern: 'formulaic-challenges', startIndex: m.index, endIndex: m.index + m[0].length, match: m[0], severity: 'low', suggestion: 'This is a formulaic pattern. State the actual challenge directly.' });
      }
    }
    return d;
  }

  fix(text: string): string { return text; }
}
