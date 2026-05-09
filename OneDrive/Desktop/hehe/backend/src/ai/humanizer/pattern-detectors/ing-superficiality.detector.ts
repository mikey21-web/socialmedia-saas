import { Detection, PatternDetector } from '../types';

const ING_PATTERNS = [
  /\b(?:driving|enabling|ensuring|providing|delivering|offering|creating|building|establishing|maintaining)\s+(?:growth|success|value|excellence|results|outcomes|impact|innovation|transformation)\b/gi,
];

export class IngSuperficialityDetector implements PatternDetector {
  name = 'ing-superficiality';
  category = 'content' as const;

  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    for (const regex of ING_PATTERNS) {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        detections.push({
          pattern: 'ing-superficiality',
          startIndex: m.index, endIndex: m.index + m[0].length,
          match: m[0], severity: 'medium',
          suggestion: 'Vague "-ing + abstract noun" pattern. Be specific about what happened.',
        });
      }
    }
    return detections;
  }

  fix(text: string): string {
    return text;
  }
}
