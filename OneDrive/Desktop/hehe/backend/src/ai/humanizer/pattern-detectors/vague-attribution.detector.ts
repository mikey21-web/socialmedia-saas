import { Detection, PatternDetector } from '../types';

const VAGUE = [
  /\b(?:many people|some experts|various studies|numerous reports|several sources)\b/gi,
  /\b(?:it has been (?:said|shown|proven|noted))\b/gi,
  /\b(?:according to (?:some|many|various|numerous))\b/gi,
];

export class VagueAttributionDetector implements PatternDetector {
  name = 'vague-attribution';
  category = 'content' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    for (const regex of VAGUE) {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        d.push({ pattern: 'vague-attribution', startIndex: m.index, endIndex: m.index + m[0].length, match: m[0], severity: 'medium', suggestion: 'Cite a specific source or remove the attribution.' });
      }
    }
    return d;
  }

  fix(text: string): string { return text; }
}
