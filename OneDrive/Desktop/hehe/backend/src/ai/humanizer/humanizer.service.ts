import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../agents/llm/llm.service';
import { Detection, HumanizerContext } from './types';
import { getAllDetectors } from './pattern-detectors';
import { ANTI_SLOP_RULES } from '../prompt-policy/anti-slop-policy';

export interface HumanizeResult {
  original: string;
  humanized: string;
  detections: Detection[];
  aiScore: number;
  finalAiScore: number;
}

@Injectable()
export class HumanizerService {
  private readonly logger = new Logger(HumanizerService.name);
  private readonly detectors = getAllDetectors();

  constructor(private readonly llm: LlmService) {}

  async humanize(
    text: string,
    context?: HumanizerContext,
  ): Promise<HumanizeResult> {
    const allDetections: Detection[] = [];
    let working = text;

    const contentDetectors = this.detectors.filter(d => d.category === 'content');
    const languageDetectors = this.detectors.filter(d => d.category === 'language');
    const styleDetectors = this.detectors.filter(d => d.category === 'style');
    const commDetectors = this.detectors.filter(d => d.category === 'communication');

    for (const group of [contentDetectors, languageDetectors, styleDetectors, commDetectors]) {
      for (const detector of group) {
        const detections = detector.detect(working);
        allDetections.push(...detections);
        if (detections.length > 0) {
          working = detector.fix(working, context);
        }
      }
    }

    const aiScore = this.scoreAiLikelihood(text);

    let finalText = working;
    if (aiScore > 30) {
      try {
        const refined = await this.llmRefine(working, context);
        if (refined && refined.length > 20) {
          finalText = refined;
        }
      } catch (err) {
        this.logger.warn('LLM refinement failed, using rule-based output', err);
      }
    }

    const finalAiScore = this.scoreAiLikelihood(finalText);

    return {
      original: text,
      humanized: finalText,
      detections: allDetections,
      aiScore,
      finalAiScore,
    };
  }

  scoreAiLikelihood(text: string): number {
    let score = 0;
    const weights: Record<string, number> = {
      high: 8,
      medium: 4,
      low: 2,
    };

    for (const detector of this.detectors) {
      const detections = detector.detect(text);
      for (const d of detections) {
        score += weights[d.severity] ?? 2;
      }
    }

    return Math.min(100, score);
  }

  private async llmRefine(text: string, context?: HumanizerContext): Promise<string> {
    const platformHint = context?.platform
      ? `This is for ${context.platform}.`
      : '';

    const prompt = `${ANTI_SLOP_RULES}

You are an expert editor. Your job is to make this text sound like a real human wrote it, not an AI.

Rules:
- Vary sentence length naturally (mix short punchy sentences with longer ones)
- Use contractions (it's, can't, we're, don't)
- Remove any remaining corporate/AI buzzwords
- No em-dashes, use commas or periods instead
- No "Additionally", "Furthermore", "Moreover"
- No forced "rule of three" lists
- Have a clear perspective, don't be wishy-washy
- Keep the same meaning and key information
- Match the length roughly (don't pad or trim significantly)
${platformHint}

Text to humanize:
"${text}"

Return ONLY the rewritten text, no explanations.`;

    return this.llm.complete(prompt, { maxTokens: 2048, temperature: 0.8 });
  }
}
