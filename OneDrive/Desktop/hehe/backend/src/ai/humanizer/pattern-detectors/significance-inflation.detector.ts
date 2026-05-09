import { Detection, PatternDetector } from '../types';

const INFLATED = [
  'groundbreaking', 'revolutionary', 'game-changing', 'transformative',
  'unprecedented', 'extraordinary', 'remarkable', 'exceptional',
  'incredible', 'unparalleled', 'world-class', 'best-in-class',
  'paradigm-shifting', 'trailblazing', 'visionary', 'monumental',
];

export class SignificanceInflationDetector implements PatternDetector {
  name = 'significance-inflation';
  category = 'content' as const;

  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    for (const word of INFLATED) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        detections.push({
          pattern: 'significance-inflation',
          startIndex: m.index, endIndex: m.index + m[0].length,
          match: m[0], severity: 'high',
          suggestion: `"${m[0]}" is inflated. Use a specific claim instead.`,
        });
      }
    }
    return detections;
  }

  fix(text: string): string {
    let r = text;
    const map: Record<string, string> = {
      'groundbreaking': 'new', 'revolutionary': 'different', 'game-changing': 'useful',
      'transformative': 'helpful', 'unprecedented': 'rare', 'extraordinary': 'notable',
      'remarkable': 'worth noting', 'exceptional': 'strong', 'incredible': 'surprising',
      'unparalleled': 'rare', 'world-class': 'top-tier', 'best-in-class': 'competitive',
      'paradigm-shifting': 'different', 'trailblazing': 'early', 'visionary': 'forward-thinking',
      'monumental': 'significant',
    };
    for (const [k, v] of Object.entries(map)) {
      r = r.replace(new RegExp(`\\b${k}\\b`, 'gi'), v);
    }
    return r;
  }
}
