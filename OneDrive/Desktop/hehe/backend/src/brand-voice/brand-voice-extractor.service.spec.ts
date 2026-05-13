import { BrandVoiceExtractorService } from './brand-voice-extractor.service';
import { LlmService } from '../agents/llm/llm.service';
import { SamplePostDto } from './dto/upload-samples.dto';

describe('BrandVoiceExtractorService', () => {
  let service: BrandVoiceExtractorService;
  let llm: { completeJson: jest.Mock };

  const samples: SamplePostDto[] = [
    {
      platform: 'linkedin',
      caption: 'Our quarterly review outlines measurable progress. Please review the attached summary. #growth #ops',
      hashtags: ['#growth', '#ops'],
    },
    {
      platform: 'instagram',
      caption: 'We shipped faster today 🚀 The team kept it simple and useful. #buildinpublic',
      hashtags: ['#buildinpublic'],
    },
    {
      platform: 'instagram',
      caption: 'Three lessons:\n- Keep the promise clear\n- Show proof\n- Ask for one action #marketing',
      hashtags: ['#marketing'],
    },
  ];

  beforeEach(() => {
    llm = {
      completeJson: jest.fn(async (prompt: string) => {
        if (prompt.includes('tone')) {
          return {
            formality: 0.82,
            playfulness: 0.25,
            urgency: 0.35,
            warmth: 0.55,
            technicality: 0.4,
            authority: 0.76,
            vulnerability: 0.1,
            humor: 0.15,
            directness: 0.7,
            inspiration: 0.45,
          };
        }
        return {
          commonWords: ['review', 'team', 'clear'],
          avoidWords: ['synergy'],
          industryTerms: ['ops', 'marketing'],
        };
      }),
    };
    service = new BrandVoiceExtractorService(llm as unknown as LlmService);
  });

  it('extracts formal tone dimensions from formal samples', async () => {
    const tone = await service.extractTone(samples[0].caption);
    expect(tone.formality).toBeGreaterThan(0.8);
    expect(tone.authority).toBeGreaterThan(0.7);
  });

  it('sends sample text to tone LLM prompt', async () => {
    await service.extractTone('Please review the quarterly summary.');
    expect(llm.completeJson.mock.calls[0][0]).toContain('quarterly summary');
  });

  it('extracts vocabulary from LLM result', async () => {
    const vocabulary = await service.extractVocabulary(samples.map((s) => s.caption).join('\n'));
    expect(vocabulary.commonWords).toEqual(expect.arrayContaining(['review', 'team']));
    expect(vocabulary.avoidWords).toContain('synergy');
  });

  it('extracts industry terms', async () => {
    const vocabulary = await service.extractVocabulary('ops marketing ops');
    expect(vocabulary.industryTerms).toEqual(expect.arrayContaining(['ops', 'marketing']));
  });

  it('computes emoji frequency', async () => {
    const emoji = await service.extractEmojiPatterns('Launch 🚀 today 🚀');
    expect(emoji.frequency).toBeGreaterThan(0);
  });

  it('sorts preferred emojis by usage count', async () => {
    const emoji = await service.extractEmojiPatterns('🚀 ✅ 🚀');
    expect(emoji.preferred[0]).toBe('🚀');
  });

  it('returns empty emoji preferences for text without emojis', async () => {
    const emoji = await service.extractEmojiPatterns('No emoji here');
    expect(emoji.preferred).toEqual([]);
    expect(emoji.frequency).toBe(0);
  });

  it('computes average sentence length', async () => {
    const patterns = await service.extractSentencePatterns(['Short sentence. This one has five words.']);
    expect(patterns.avgLength).toBeGreaterThan(1);
  });

  it('detects list preference when samples use lists', async () => {
    const patterns = await service.extractSentencePatterns(['- One\n- Two', '1. First\n2. Second']);
    expect(patterns.preferLists).toBe(true);
  });

  it('defaults sentence patterns for empty captions', async () => {
    const patterns = await service.extractSentencePatterns([]);
    expect(patterns.avgLength).toBe(14);
    expect(patterns.variation).toBe(0);
  });

  it('detects end hashtag placement', async () => {
    const style = await service.extractHashtagStyle(samples);
    expect(style.placement).toBe('end');
  });

  it('counts hashtags per sample with hashtags', async () => {
    const style = await service.extractHashtagStyle(samples);
    expect(style.count).toBeGreaterThanOrEqual(1);
  });

  it('detects lowercase hashtag format', async () => {
    const style = await service.extractHashtagStyle(samples);
    expect(style.format).toBe('lowercase');
  });

  it('handles empty samples array gracefully', async () => {
    const result = await service.extractAll([]);
    expect(result.emojiPatterns.frequency).toBe(0);
    expect(result.sentencePatterns.avgLength).toBe(14);
    expect(result.hashtagStyle.count).toBe(5);
  });

  it('handles a single post sample', async () => {
    const result = await service.extractAll([samples[1]]);
    expect(result.toneDimensions.formality).toBeGreaterThan(0);
    expect(result.emojiPatterns.preferred).toContain('🚀');
  });

  it('returns empty embedding when Voyage key is not configured', async () => {
    const original = process.env.VOYAGE_API_KEY;
    delete process.env.VOYAGE_API_KEY;
    await expect(service.generateEmbedding(samples)).resolves.toEqual([]);
    process.env.VOYAGE_API_KEY = original;
  });
});
