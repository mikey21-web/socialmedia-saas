import { MultilingualService, LANGUAGE_NAMES, LANGUAGE_PROMPTS } from './multilingual.service';
import { LlmService } from '../../agents/llm/llm.service';

describe('MultilingualService', () => {
  let service: MultilingualService;
  const mockLlm = {
    complete: jest.fn(),
    completeJson: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MultilingualService(mockLlm as unknown as LlmService);
  });

  it('has 8 supported languages', () => {
    const languages = service.getLanguages();
    expect(languages).toHaveLength(8);
    expect(languages.map(l => l.code)).toContain('hi');
    expect(languages.map(l => l.code)).toContain('ta');
    expect(languages.map(l => l.code)).toContain('te');
    expect(languages.map(l => l.code)).toContain('mr');
  });

  it('generates caption in Hindi', async () => {
    mockLlm.completeJson.mockResolvedValue({
      content: 'आज का स्पेशल offer — 20% off on all bookings!',
      hashtags: ['#salon', '#offer', '#beauty'],
    });

    const result = await service.generateCaption('salon discount', 'hi', {
      platform: 'instagram',
      brandName: 'Glow Studio',
    });

    expect(result.language).toBe('hi');
    expect(result.content).toBeTruthy();
    expect(mockLlm.completeJson).toHaveBeenCalledWith(
      expect.stringContaining('Hindi'),
      expect.any(Object),
    );
  });

  it('translates English to Tamil', async () => {
    mockLlm.complete.mockResolvedValue('இன்றைய special offer — 20% off!');

    const result = await service.translateContent(
      'Today special offer — 20% off!',
      'ta',
    );

    expect(result).toBeTruthy();
    expect(mockLlm.complete).toHaveBeenCalledWith(
      expect.stringContaining('Tamil'),
      expect.any(Object),
    );
  });

  it('returns English content as-is when target is en', async () => {
    const result = await service.translateContent('Hello world', 'en');
    expect(result).toBe('Hello world');
    expect(mockLlm.complete).not.toHaveBeenCalled();
  });

  it('language prompts instruct code-switching', () => {
    expect(LANGUAGE_PROMPTS.hi).toContain('English words');
    expect(LANGUAGE_PROMPTS.ta).toContain('English words');
    expect(LANGUAGE_PROMPTS.te).toContain('English words');
  });
});
