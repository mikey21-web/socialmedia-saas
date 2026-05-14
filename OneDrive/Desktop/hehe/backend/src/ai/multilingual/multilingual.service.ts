import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../agents/llm/llm.service';

export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'mr' | 'bn' | 'kn' | 'ml';

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  bn: 'Bengali',
  kn: 'Kannada',
  ml: 'Malayalam',
};

export const LANGUAGE_PROMPTS: Record<SupportedLanguage, string> = {
  en: 'Write in English.',
  hi: 'Write in Hindi (Devanagari script). Use natural conversational Hindi as spoken by urban Indians. Mix in common English words that Hindi speakers naturally use (like "booking", "offer", "link in bio"). Do NOT use overly formal/Sanskritized Hindi.',
  ta: 'Write in Tamil (Tamil script). Use natural conversational Tamil as spoken in Chennai/urban Tamil Nadu. Mix in common English words that Tamil speakers naturally use.',
  te: 'Write in Telugu (Telugu script). Use natural conversational Telugu as spoken in Hyderabad/urban Andhra/Telangana. Mix in common English words that Telugu speakers naturally use.',
  mr: 'Write in Marathi (Devanagari script). Use natural conversational Marathi as spoken in Mumbai/Pune. Mix in common English words that Marathi speakers naturally use.',
  bn: 'Write in Bengali (Bengali script). Use natural conversational Bengali as spoken in Kolkata/urban West Bengal.',
  kn: 'Write in Kannada (Kannada script). Use natural conversational Kannada as spoken in Bangalore/urban Karnataka.',
  ml: 'Write in Malayalam (Malayalam script). Use natural conversational Malayalam as spoken in Kochi/urban Kerala.',
};

/**
 * Multi-language content generation service.
 * Generates social media content in Indian regional languages.
 *
 * Key insight: Indian social media users code-switch heavily.
 * A Hindi Instagram caption naturally includes English words like
 * "booking", "offer", "DM", "link in bio". We instruct the LLM
 * to match this natural code-switching pattern.
 */
@Injectable()
export class MultilingualService {
  private readonly logger = new Logger(MultilingualService.name);

  constructor(private readonly llm: LlmService) {}

  /**
   * Generate a caption in the specified language.
   */
  async generateCaption(
    topic: string,
    language: SupportedLanguage,
    context: {
      platform?: string;
      tone?: string;
      brandName?: string;
      audience?: string;
    } = {},
  ): Promise<{ content: string; hashtags: string[]; language: SupportedLanguage }> {
    const langPrompt = LANGUAGE_PROMPTS[language];
    const platformHint = context.platform ? `Platform: ${context.platform}.` : '';
    const toneHint = context.tone ? `Tone: ${context.tone}.` : '';
    const brandHint = context.brandName ? `Brand: ${context.brandName}.` : '';
    const audienceHint = context.audience ? `Audience: ${context.audience}.` : '';

    const prompt = `Generate a social media post caption.

Topic: ${topic}
${langPrompt}
${platformHint}
${toneHint}
${brandHint}
${audienceHint}

Rules:
- Keep it under 300 characters for Instagram, under 280 for X/Twitter
- Include 3-5 relevant hashtags (hashtags can be in English even if caption is in another language)
- Be specific and actionable, not generic
- No em-dashes, no corporate buzzwords
- Sound like a real person posting, not a brand

Return JSON: {"content": "the caption", "hashtags": ["#tag1", "#tag2"]}`;

    const result = await this.llm.completeJson<{ content: string; hashtags: string[] }>(prompt, {
      maxTokens: 512,
      temperature: 0.8,
    });

    return { ...result, language };
  }

  /**
   * Translate existing content to another language while preserving tone.
   */
  async translateContent(
    content: string,
    targetLanguage: SupportedLanguage,
    context: { platform?: string; tone?: string } = {},
  ): Promise<string> {
    if (targetLanguage === 'en') {
      return content; // Already English
    }

    const langPrompt = LANGUAGE_PROMPTS[targetLanguage];

    const prompt = `Translate this social media caption to ${LANGUAGE_NAMES[targetLanguage]}.

Original (English):
"${content}"

${langPrompt}

Rules:
- Preserve the tone and energy of the original
- Keep hashtags in English
- Keep brand names in English
- Keep platform-specific terms in English (DM, link in bio, etc.)
- Adapt cultural references if needed
- Do NOT translate literally — adapt naturally

Return ONLY the translated caption, no explanation.`;

    return this.llm.complete(prompt, { maxTokens: 512, temperature: 0.7 });
  }

  /**
   * Get available languages.
   */
  getLanguages() {
    return Object.entries(LANGUAGE_NAMES).map(([code, name]) => ({
      code,
      name,
      script: this.getScript(code as SupportedLanguage),
    }));
  }

  private getScript(lang: SupportedLanguage): string {
    const scripts: Record<SupportedLanguage, string> = {
      en: 'Latin',
      hi: 'Devanagari',
      ta: 'Tamil',
      te: 'Telugu',
      mr: 'Devanagari',
      bn: 'Bengali',
      kn: 'Kannada',
      ml: 'Malayalam',
    };
    return scripts[lang];
  }
}
