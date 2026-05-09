export interface Detection {
  pattern: string;
  startIndex: number;
  endIndex: number;
  match: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface HumanizerContext {
  platform?: string;
  vertical?: string;
  toneDimensions?: Record<string, number>;
}

export interface PatternDetector {
  name: string;
  category: 'content' | 'language' | 'style' | 'communication';
  detect(text: string): Detection[];
  fix(text: string, context?: HumanizerContext): string;
}
