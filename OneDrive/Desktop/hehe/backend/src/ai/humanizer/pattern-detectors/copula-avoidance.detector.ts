import { Detection, PatternDetector } from '../types';

const COPULA_AVOIDANCE = [
  { regex: /\b(\w+)\s+serves as\s+/gi, replacement: '$1 is ' },
  { regex: /\b(\w+)\s+acts as\s+/gi, replacement: '$1 is ' },
  { regex: /\b(\w+)\s+functions as\s+/gi, replacement: '$1 is ' },
  { regex: /\b(\w+)\s+stands as\s+/gi, replacement: '$1 is ' },
  { regex: /\b(\w+)\s+remains\s+(?=a |an |the )/gi, replacement: '$1 is still ' },
];

export class CopulaAvoidanceDetector implements PatternDetector {
  name = 'copula-avoidance';
  category = 'language' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    for (const { regex } of COPULA_AVOIDANCE) {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        d.push({ pattern: 'copula-avoidance', startIndex: m.index, endIndex: m.index + m[0].length, match: m[0], severity: 'medium', suggestion: 'Use "is" instead of this copula-avoidance phrase.' });
      }
    }
    return d;
  }

  fix(text: string): string {
    let r = text;
    for (const { regex, replacement } of COPULA_AVOIDANCE) {
      r = r.replace(regex, replacement);
    }
    return r;
  }
}
