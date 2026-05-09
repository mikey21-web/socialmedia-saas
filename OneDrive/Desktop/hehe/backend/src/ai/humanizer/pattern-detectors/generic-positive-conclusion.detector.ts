import { Detection, PatternDetector } from '../types';

const CONCLUSIONS = [
  /\b(?:in conclusion|to (?:sum up|summarize|wrap up)|all in all|overall)\b/gi,
  /\b(?:the (?:future|potential|possibilities) (?:is|are) (?:bright|exciting|limitless|endless|promising))\b/gi,
  /\b(?:(?:only|just the) (?:time|future) will tell)\b/gi,
  /\b(?:the (?:sky|world) is the limit)\b/gi,
  /\b(?:embrace the (?:future|change|journey|possibilities))\b/gi,
];

export class GenericPositiveConclusionDetector implements PatternDetector {
  name = 'generic-positive-conclusion';
  category = 'communication' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    for (const regex of CONCLUSIONS) {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        d.push({ pattern: 'generic-positive-conclusion', startIndex: m.index, endIndex: m.index + m[0].length, match: m[0], severity: 'medium', suggestion: 'Generic positive conclusion. End with a specific takeaway or CTA.' });
      }
    }
    return d;
  }

  fix(text: string): string { return text; }
}
