import { Detection, PatternDetector } from '../types';

const ARTIFACTS = [
  /\b(?:as an ai|as a language model|i don'?t have (?:personal )?(?:opinions|feelings|experiences))\b/gi,
  /\b(?:i'?m (?:just )?an? (?:ai|language model|chatbot))\b/gi,
  /\b(?:hope (?:this|that) helps)\b/gi,
  /\b(?:feel free to (?:ask|reach out|let me know))\b/gi,
  /\b(?:happy to help|glad to assist|here to help)\b/gi,
  /\b(?:is there anything else)\b/gi,
  /\b(?:let me know if you (?:need|have|want))\b/gi,
];

export class ChatbotArtifactsDetector implements PatternDetector {
  name = 'chatbot-artifacts';
  category = 'communication' as const;

  detect(text: string): Detection[] {
    const d: Detection[] = [];
    for (const regex of ARTIFACTS) {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        d.push({ pattern: 'chatbot-artifacts', startIndex: m.index, endIndex: m.index + m[0].length, match: m[0], severity: 'high', suggestion: 'Remove chatbot artifact phrase.' });
      }
    }
    return d;
  }

  fix(text: string): string {
    let r = text;
    for (const regex of ARTIFACTS) {
      r = r.replace(regex, '');
    }
    return r.replace(/\s{2,}/g, ' ').trim();
  }
}
