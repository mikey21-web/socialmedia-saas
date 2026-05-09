import { Detection, PatternDetector } from '../types';

export class EmDashOveruseDetector implements PatternDetector {
  name = 'em-dash-overuse';
  category = 'style' as const;

  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    const regex = /\u2014|--/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      detections.push({
        pattern: 'em-dash-overuse',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        match: match[0],
        severity: 'medium',
        suggestion: 'Replace em-dash with comma, period, or parentheses',
      });
    }
    return detections;
  }

  fix(text: string): string {
    return text
      .replace(/\s*\u2014\s*/g, ', ')
      .replace(/\s*--\s*/g, ', ');
  }
}
