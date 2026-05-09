import { Detection, PatternDetector } from '../types';

export class SynonymCyclingDetector implements PatternDetector {
  name = 'synonym-cycling';
  category = 'language' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    const groups = [
      ['important', 'crucial', 'vital', 'essential', 'critical', 'key', 'significant'],
      ['help', 'assist', 'aid', 'support', 'facilitate', 'enable'],
      ['show', 'demonstrate', 'illustrate', 'highlight', 'showcase', 'exhibit'],
      ['use', 'utilize', 'leverage', 'employ', 'harness'],
      ['make', 'create', 'develop', 'build', 'craft', 'forge'],
    ];
    const lower = text.toLowerCase();
    for (const group of groups) {
      const found = group.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(lower));
      if (found.length >= 3) {
        d.push({ pattern: 'synonym-cycling', startIndex: 0, endIndex: text.length, match: found.join(', '), severity: 'low', suggestion: `Cycling through synonyms: ${found.join(', ')}. Pick one and stick with it.` });
      }
    }
    return d;
  }

  fix(text: string): string { return text; }
}
