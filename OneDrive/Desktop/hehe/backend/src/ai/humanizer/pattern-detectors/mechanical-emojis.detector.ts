import { Detection, PatternDetector } from '../types';

export class MechanicalEmojisDetector implements PatternDetector {
  name = 'mechanical-emojis';
  category = 'style' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    const emojiLineRegex = /^[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}]\s/gmu;
    let m: RegExpExecArray | null;
    let count = 0;
    while ((m = emojiLineRegex.exec(text)) !== null) {
      count++;
    }
    if (count >= 3) {
      d.push({ pattern: 'mechanical-emojis', startIndex: 0, endIndex: text.length, match: `${count} emoji-prefixed lines`, severity: 'medium', suggestion: 'Starting every bullet/line with an emoji is mechanical. Vary or remove some.' });
    }
    return d;
  }

  fix(text: string): string {
    let lineCount = 0;
    return text.replace(/^([\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}])\s/gmu, (full, emoji: string) => {
      lineCount++;
      return lineCount % 2 === 0 ? '' : `${emoji} `;
    });
  }
}
