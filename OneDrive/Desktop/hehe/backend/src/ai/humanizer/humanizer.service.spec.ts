import { HumanizerService } from './humanizer.service';
import { LlmService } from '../../agents/llm/llm.service';

describe('HumanizerService', () => {
  let service: HumanizerService;
  let llm: { complete: jest.Mock };

  beforeEach(() => {
    llm = {
      complete: jest.fn(async (prompt: string) =>
        prompt.includes('Text to humanize') ? 'Use simple words. Make one clear point.' : 'refined',
      ),
    };
    service = new HumanizerService(llm as unknown as LlmService);
  });

  const humanize = (text: string) => service.humanize(text, { platform: 'instagram' });

  it('detects em dash overuse', async () => {
    const result = await humanize('This works — fast — simple — today.');
    expect(result.detections.some((d) => d.pattern === 'em-dash-overuse')).toBe(true);
  });

  it('fixes em dashes to comma spacing', async () => {
    const result = await humanize('This works — fast — simple.');
    expect(result.humanized).not.toContain('—');
  });

  it('detects double hyphen as em dash style', async () => {
    const result = await humanize('This works -- fast -- simple.');
    expect(result.detections.filter((d) => d.pattern === 'em-dash-overuse')).toHaveLength(2);
  });

  it('detects AI vocabulary words', async () => {
    const result = await humanize('Delve into ways to leverage tools and utilize better systems.');
    expect(result.detections.filter((d) => d.pattern === 'ai-vocabulary').length).toBeGreaterThanOrEqual(3);
  });

  it('replaces leverage with use', async () => {
    const result = await humanize('We leverage the system.');
    expect(result.humanized.toLowerCase()).toContain('use the system');
  });

  it('replaces utilize with use', async () => {
    const result = await humanize('Teams utilize checklists.');
    expect(result.humanized.toLowerCase()).toContain('use checklists');
  });

  it('replaces delve with explore', async () => {
    const result = await humanize('We delve into customer replies.');
    expect(result.humanized.toLowerCase()).toContain('explore into customer replies');
  });

  it('detects significance inflation', async () => {
    const result = await humanize('A groundbreaking, revolutionary, unprecedented launch.');
    expect(result.detections.filter((d) => d.pattern === 'significance-inflation')).toHaveLength(3);
  });

  it('reduces inflated significance language', async () => {
    const result = await humanize('This is a revolutionary offer.');
    expect(result.humanized.toLowerCase()).toContain('different offer');
  });

  it('detects filler phrases', async () => {
    const result = await humanize("It's worth noting that it's important to note that the offer changed.");
    expect(result.detections.filter((d) => d.pattern === 'filler-phrases').length).toBeGreaterThanOrEqual(2);
  });

  it('removes filler phrases', async () => {
    const result = await humanize("It's worth noting that customers reply faster.");
    expect(result.humanized.toLowerCase()).not.toContain("it's worth noting");
  });

  it('straightens curly double quotes', async () => {
    const result = await humanize('Customers said “hello”.');
    expect(result.humanized).toContain('"hello"');
  });

  it('straightens curly apostrophes', async () => {
    const result = await humanize('It’s ready.');
    expect(result.humanized).toContain("It's ready");
  });

  it('detects chatbot artifacts', async () => {
    const result = await humanize('As an AI, I hope this helps.');
    expect(result.detections.some((d) => d.pattern === 'chatbot-artifacts')).toBe(true);
  });

  it('removes chatbot artifact phrases', async () => {
    const result = await humanize('Happy to help. Send the draft today.');
    expect(result.humanized.toLowerCase()).not.toContain('happy to help');
  });

  it('detects promotional language', async () => {
    const result = await humanize('Unlock the ultimate secret to skyrocket leads.');
    expect(result.detections.filter((d) => d.pattern === 'promotional-language').length).toBeGreaterThanOrEqual(3);
  });

  it('softens promotional language', async () => {
    const result = await humanize('Unlock this proven tip.');
    expect(result.humanized).toContain('get access to this tested tip');
  });

  it('detects vague attribution', async () => {
    const result = await humanize('Many people say this works.');
    expect(result.detections.some((d) => d.pattern === 'vague-attribution')).toBe(true);
  });

  it('detects notability claims', async () => {
    const result = await humanize('Experts agree this is important.');
    expect(result.detections.some((d) => d.pattern === 'notability-claims')).toBe(true);
  });

  it('removes notability adverbs', async () => {
    const result = await humanize('Notably, this saves time.');
    expect(result.humanized).toBe('this saves time.');
  });

  it('detects title case headings', async () => {
    const result = await humanize('### Better Social Media Results\nPost daily.');
    expect(result.detections.some((d) => d.pattern === 'title-case-headings')).toBe(true);
  });

  it('converts title case headings to sentence case', async () => {
    const result = await humanize('### Better Social Media Results\nPost daily.');
    expect(result.humanized).toContain('### Better social media results');
  });

  it('detects excessive bold segments', async () => {
    const result = await humanize('**One** **Two** **Three** **Four**');
    expect(result.detections.some((d) => d.pattern === 'excessive-bold')).toBe(true);
  });

  it('detects excessive hedging after repeated hedges', async () => {
    const result = await humanize('Perhaps this works. Potentially it helps. Arguably it matters.');
    expect(result.detections.some((d) => d.pattern === 'excessive-hedging')).toBe(true);
  });

  it('runs full humanize pipeline and lowers score', async () => {
    const text = "It's worth noting that this groundbreaking tool can leverage growth — fast — now.";
    const result = await humanize(text);
    expect(result.finalAiScore).toBeLessThan(result.aiScore);
  });

  it('scores clean human text low', () => {
    expect(service.scoreAiLikelihood('I tried the new booking flow today. Two clients replied within an hour.')).toBeLessThan(30);
  });

  it('scores AI-heavy text high', () => {
    const text = 'Groundbreaking revolutionary unprecedented leverage utilize delve. As an AI, it is important to note that this can unlock the ultimate solution — fast — simple.';
    expect(service.scoreAiLikelihood(text)).toBeGreaterThan(60);
  });
});
