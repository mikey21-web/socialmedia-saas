import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../agents/llm/llm.service';
import { SamplePostDto } from './dto/upload-samples.dto';

export interface ToneDimensions {
  formality: number;
  playfulness: number;
  urgency: number;
  warmth: number;
  technicality: number;
  authority: number;
  vulnerability: number;
  humor: number;
  directness: number;
  inspiration: number;
}

export interface VocabularyBank {
  commonWords: string[];
  avoidWords: string[];
  industryTerms: string[];
}

export interface EmojiPatterns {
  frequency: number;
  preferred: string[];
  avoidEmojis: string[];
}

export interface SentencePatterns {
  avgLength: number;
  variation: number;
  preferLists: boolean;
}

export interface HashtagStyle {
  placement: 'first' | 'middle' | 'end';
  count: number;
  format: 'lowercase' | 'camelCase' | 'TitleCase';
}

export interface ExtractionResult {
  toneDimensions: ToneDimensions;
  vocabularyBank: VocabularyBank;
  emojiPatterns: EmojiPatterns;
  sentencePatterns: SentencePatterns;
  hashtagStyle: HashtagStyle;
}

@Injectable()
export class BrandVoiceExtractorService {
  private readonly logger = new Logger(BrandVoiceExtractorService.name);

  constructor(private readonly llm: LlmService) {}

  async extractAll(samples: SamplePostDto[]): Promise<ExtractionResult> {
    const captions = samples.map(s => s.caption);
    const combined = captions.join('\n---\n');

    const [toneDimensions, vocabularyBank, emojiPatterns, sentencePatterns, hashtagStyle] =
      await Promise.all([
        this.extractTone(combined),
        this.extractVocabulary(combined),
        this.extractEmojiPatterns(combined),
        this.extractSentencePatterns(captions),
        this.extractHashtagStyle(samples),
      ]);

    return { toneDimensions, vocabularyBank, emojiPatterns, sentencePatterns, hashtagStyle };
  }

  async extractTone(combined: string): Promise<ToneDimensions> {
    const prompt = `Analyze the tone of these social media posts across 10 dimensions. Each score is 0-1.

Posts:
${combined.slice(0, 8000)}

Return JSON:
{
  "formality": 0.5,
  "playfulness": 0.5,
  "urgency": 0.3,
  "warmth": 0.7,
  "technicality": 0.2,
  "authority": 0.5,
  "vulnerability": 0.3,
  "humor": 0.4,
  "directness": 0.6,
  "inspiration": 0.5
}`;

    return this.llm.completeJson<ToneDimensions>(prompt, { maxTokens: 512 });
  }

  async extractVocabulary(combined: string): Promise<VocabularyBank> {
    const prompt = `Analyze vocabulary patterns from these social media posts.

Posts:
${combined.slice(0, 8000)}

Return JSON:
{
  "commonWords": ["word1", "word2"],
  "avoidWords": ["word1"],
  "industryTerms": ["term1", "term2"]
}

commonWords: top 50 most frequently used words/phrases.
avoidWords: words that are clearly absent from this person's writing style.
industryTerms: domain-specific jargon used.`;

    return this.llm.completeJson<VocabularyBank>(prompt, { maxTokens: 1024 });
  }

  async extractEmojiPatterns(combined: string): Promise<EmojiPatterns> {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const allEmojis = combined.match(emojiRegex) ?? [];
    const totalChars = combined.length;
    const frequency = totalChars > 0 ? Math.min(1, allEmojis.length / (totalChars / 100)) : 0;

    const emojiCounts = new Map<string, number>();
    for (const emoji of allEmojis) {
      emojiCounts.set(emoji, (emojiCounts.get(emoji) ?? 0) + 1);
    }

    const sorted = [...emojiCounts.entries()].sort((a, b) => b[1] - a[1]);
    const preferred = sorted.slice(0, 10).map(([emoji]) => emoji);

    return {
      frequency: Math.round(frequency * 100) / 100,
      preferred,
      avoidEmojis: [],
    };
  }

  async extractSentencePatterns(captions: string[]): Promise<SentencePatterns> {
    const allSentences = captions
      .flatMap(c => c.split(/[.!?\n]+/).filter(s => s.trim().length > 3));

    const lengths = allSentences.map(s => s.trim().split(/\s+/).length);
    const avg = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 14;
    const mean = avg;
    const variance =
      lengths.length > 1
        ? lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length
        : 0;
    const stdDev = Math.sqrt(variance);
    const variation = mean > 0 ? stdDev / mean : 0;

    const listPatterns = captions.filter(
      c => c.includes('1.') || c.includes('- ') || c.includes('* ') || c.includes('•'),
    );
    const preferLists = listPatterns.length > captions.length * 0.3;

    return {
      avgLength: Math.round(avg),
      variation: Math.round(variation * 100) / 100,
      preferLists,
    };
  }

  async extractHashtagStyle(samples: SamplePostDto[]): Promise<HashtagStyle> {
    const allHashtags: string[] = [];
    let endCount = 0;
    let startCount = 0;
    let middleCount = 0;
    let totalCount = 0;

    for (const sample of samples) {
      const tags = sample.hashtags ?? [];
      allHashtags.push(...tags);

      const captionTrimmed = sample.caption.trim();
      const hashInCaption = captionTrimmed.match(/#\w+/g) ?? [];
      totalCount += hashInCaption.length;

      if (hashInCaption.length === 0) continue;

      const firstHashPos = captionTrimmed.indexOf('#');
      const relativePos = firstHashPos / Math.max(1, captionTrimmed.length);

      if (relativePos < 0.2) startCount++;
      else if (relativePos > 0.7) endCount++;
      else middleCount++;
    }

    const placement =
      endCount >= startCount && endCount >= middleCount
        ? 'end' as const
        : startCount >= middleCount
          ? 'first' as const
          : 'middle' as const;

    const samplesWithHash = samples.filter(
      s => (s.hashtags?.length ?? 0) > 0 || s.caption.includes('#'),
    );
    const avgCount =
      samplesWithHash.length > 0
        ? Math.round(totalCount / samplesWithHash.length)
        : 5;

    const lowerCount = allHashtags.filter(t => t === t.toLowerCase()).length;
    const format =
      lowerCount > allHashtags.length * 0.6
        ? 'lowercase' as const
        : 'camelCase' as const;

    return { placement, count: avgCount, format };
  }

  async generateEmbedding(samples: SamplePostDto[]): Promise<number[]> {
    const combined = samples.map(s => s.caption).join(' ');
    const voyageKey = process.env.VOYAGE_API_KEY;

    if (voyageKey) {
      try {
        const response = await fetch('https://api.voyageai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${voyageKey}`,
          },
          body: JSON.stringify({
            input: [combined.slice(0, 8000)],
            model: 'voyage-3-large',
          }),
        });

        const data = (await response.json()) as {
          data?: Array<{ embedding: number[] }>;
        };

        if (data.data?.[0]?.embedding) {
          return data.data[0].embedding;
        }
      } catch (err) {
        this.logger.warn('Voyage embedding failed, returning empty vector', err);
      }
    }

    return [];
  }
}
