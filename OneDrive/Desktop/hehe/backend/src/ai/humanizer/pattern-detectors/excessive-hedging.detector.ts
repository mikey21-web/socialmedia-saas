import { Detection, PatternDetector } from '../types';

const HEDGES = [
  'it seems like', 'it appears that', 'it could be argued',
  'one might say', 'perhaps', 'potentially', 'arguably',
  'it is possible that', 'there is a chance that',
  'it may be worth considering', 'it might be helpful to',
  'to some extent', 'in some ways', 'in a sense',
];

export class ExcessiveHedgingDetector implements PatternDetector {
  name = 'excessive-hedging';
  category = 'communication' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    const lower = text.toLowerCase();
    let count = 0;
    for (const hedge of HEDGES) {
      let idx = lower.indexOf(hedge);
      while (idx !== -1) {
        count++;
        if (count > 2) {
          d.push({ pattern: 'excessive-hedging', startIndex: idx, endIndex: idx + hedge.length, match: text.slice(idx, idx + hedge.length), severity: 'medium', suggestion: 'Too much hedging. Take a position.' });
        }
        idx = lower.indexOf(hedge, idx + 1);
      }
    }
    return d;
  }

  fix(text: string): string {
    let r = text;
    for (const hedge of HEDGES) {
      const regex = new RegExp(hedge.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ',?\\s*', 'gi');
      r = r.replace(regex, '');
    }
    return r.replace(/\s{2,}/g, ' ').trim();
  }
}
