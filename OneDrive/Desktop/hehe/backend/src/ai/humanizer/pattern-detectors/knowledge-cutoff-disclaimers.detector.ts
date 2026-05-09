import { Detection, PatternDetector } from '../types';

const DISCLAIMERS = [
  /\b(?:as of (?:my|the) (?:last )?(?:knowledge |training )?(?:cutoff|update))\b/gi,
  /\b(?:my (?:training )?data (?:only )?(?:goes|extends) (?:up )?to)\b/gi,
  /\b(?:i (?:may|might) not have the (?:latest|most recent))\b/gi,
  /\b(?:please (?:verify|check|confirm) (?:this|these) (?:with|from))\b/gi,
];

export class KnowledgeCutoffDisclaimersDetector implements PatternDetector {
  name = 'knowledge-cutoff-disclaimers';
  category = 'communication' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    for (const regex of DISCLAIMERS) {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        d.push({ pattern: 'knowledge-cutoff-disclaimers', startIndex: m.index, endIndex: m.index + m[0].length, match: m[0], severity: 'high', suggestion: 'Remove knowledge cutoff disclaimer.' });
      }
    }
    return d;
  }

  fix(text: string): string {
    let r = text;
    for (const regex of DISCLAIMERS) {
      r = r.replace(regex, '');
    }
    return r.replace(/\s{2,}/g, ' ').trim();
  }
}
