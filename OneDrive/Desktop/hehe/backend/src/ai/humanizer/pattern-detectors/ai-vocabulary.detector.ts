import { Detection, PatternDetector } from '../types';

const AI_WORDS: Record<string, string> = {
  'additionally': 'also',
  'align with': 'match',
  'crucial': 'important',
  'delve': 'explore',
  'delve into': 'look at',
  'emphasizing': 'stressing',
  'enduring': 'lasting',
  'enhance': 'improve',
  'fostering': 'building',
  'garner': 'get',
  'highlight': 'point out',
  'interplay': 'interaction',
  'intricate': 'complex',
  'intricacies': 'details',
  'pivotal': 'key',
  'showcase': 'show',
  'tapestry': 'mix',
  'testament': 'proof',
  'underscore': 'stress',
  'valuable': 'useful',
  'vibrant': 'lively',
  'landscape': 'field',
  'navigate': 'handle',
  'leverage': 'use',
  'streamline': 'simplify',
  'seamless': 'smooth',
  'robust': 'strong',
  'embark': 'start',
  'unveil': 'reveal',
  'foster': 'build',
  'meticulous': 'careful',
  'furthermore': 'also',
  'moreover': 'also',
  'nevertheless': 'still',
  'consequently': 'so',
  'utilize': 'use',
  'facilitate': 'help',
  'endeavor': 'try',
  'comprehensive': 'full',
  'innovative': 'new',
  'cutting-edge': 'modern',
  'game-changer': 'big shift',
  'paradigm': 'model',
  'synergy': 'teamwork',
  'holistic': 'complete',
  'empower': 'help',
  'elevate': 'raise',
};

export class AiVocabularyDetector implements PatternDetector {
  name = 'ai-vocabulary';
  category = 'language' as const;

  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    for (const word of Object.keys(AI_WORDS)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        detections.push({
          pattern: 'ai-vocabulary',
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          match: match[0],
          severity: 'medium',
          suggestion: `Replace "${match[0]}" with "${AI_WORDS[word.toLowerCase()]}"`,
        });
      }
    }
    return detections;
  }

  fix(text: string): string {
    let result = text;
    for (const [aiWord, human] of Object.entries(AI_WORDS)) {
      result = result.replace(new RegExp(`\\b${aiWord}\\b`, 'gi'), human);
    }
    return result;
  }
}
