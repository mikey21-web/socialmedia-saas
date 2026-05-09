import { Detection, PatternDetector } from '../types';

const FILLER_PHRASES = [
  "it's important to note that",
  "it's worth noting that",
  "it is important to",
  "it is worth mentioning",
  "it should be noted that",
  "it goes without saying",
  "needless to say",
  "at the end of the day",
  "in today's world",
  "in this day and age",
  "when it comes to",
  "the fact of the matter is",
  "in terms of",
  "as a matter of fact",
  "for all intents and purposes",
  "at this point in time",
  "in the realm of",
  "in the world of",
  "when all is said and done",
  "the bottom line is",
  "let's dive in",
  "without further ado",
  "so without further ado",
  "let's get started",
  "first and foremost",
  "last but not least",
  "all in all",
];

export class FillerPhrasesDetector implements PatternDetector {
  name = 'filler-phrases';
  category = 'communication' as const;

  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    const lower = text.toLowerCase();
    for (const phrase of FILLER_PHRASES) {
      let idx = lower.indexOf(phrase);
      while (idx !== -1) {
        detections.push({
          pattern: 'filler-phrases',
          startIndex: idx,
          endIndex: idx + phrase.length,
          match: text.slice(idx, idx + phrase.length),
          severity: 'medium',
          suggestion: `Remove filler phrase "${phrase}"`,
        });
        idx = lower.indexOf(phrase, idx + 1);
      }
    }
    return detections;
  }

  fix(text: string): string {
    let result = text;
    for (const phrase of FILLER_PHRASES) {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      result = result.replace(regex, '');
    }
    return result.replace(/\s{2,}/g, ' ').replace(/^\s+/gm, '').trim();
  }
}
