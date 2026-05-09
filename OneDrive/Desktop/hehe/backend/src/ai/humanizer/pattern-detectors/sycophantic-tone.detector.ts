import { Detection, PatternDetector } from '../types';

const SYCOPHANTIC = [
  /\b(?:great question|excellent point|that'?s a (?:great|excellent|wonderful|fantastic) (?:question|point|idea|observation))\b/gi,
  /\b(?:absolutely|certainly|definitely|of course)!\s/gi,
  /\b(?:you'?re (?:absolutely |completely )?right)\b/gi,
  /\b(?:what a (?:great|brilliant|wonderful|fantastic) (?:idea|thought|insight))\b/gi,
];

export class SycophanticToneDetector implements PatternDetector {
  name = 'sycophantic-tone';
  category = 'communication' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    for (const regex of SYCOPHANTIC) {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        d.push({ pattern: 'sycophantic-tone', startIndex: m.index, endIndex: m.index + m[0].length, match: m[0], severity: 'high', suggestion: 'Remove sycophantic opener. Get to the point.' });
      }
    }
    return d;
  }

  fix(text: string): string {
    let r = text;
    for (const regex of SYCOPHANTIC) {
      r = r.replace(regex, '');
    }
    return r.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
  }
}
