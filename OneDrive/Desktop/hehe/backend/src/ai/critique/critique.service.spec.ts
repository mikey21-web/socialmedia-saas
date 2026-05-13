import { CritiqueService } from './critique.service';
import { LlmService } from '../../agents/llm/llm.service';

describe('CritiqueService', () => {
  let service: CritiqueService;
  let mockLlm: jest.Mocked<Partial<LlmService>>;

  beforeEach(() => {
    mockLlm = {
      complete: jest.fn(),
      completeJson: jest.fn(),
    };
    service = new CritiqueService(mockLlm as LlmService);
  });

  describe('detectAiSlop (no LLM call)', () => {
    it('flags em-dashes', () => {
      const result = service.detectAiSlop('This is great — really great.');
      expect(result.flags.some((f) => f.includes('em-dash'))).toBe(true);
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('flags Additionally / Furthermore', () => {
      const result = service.detectAiSlop('This is good. Additionally, it solves problems. Furthermore, customers love it.');
      expect(result.flags.length).toBeGreaterThanOrEqual(2);
    });

    it('flags corporate buzzwords', () => {
      const result = service.detectAiSlop('Leverage our cutting-edge platform to unlock seamlessly integrated workflows.');
      expect(result.flags.length).toBeGreaterThan(2);
      expect(result.riskScore).toBeGreaterThan(20);
    });

    it('flags forced rule-of-three when used multiple times', () => {
      const result = service.detectAiSlop('We offer speed, quality, and reliability. Our clients save time, money, and effort.');
      expect(result.flags.some((f) => f.includes('rule-of-three'))).toBe(true);
    });

    it('flags generic openers', () => {
      const result = service.detectAiSlop('Are you tired of slow customer support?');
      expect(result.flags.some((f) => f.includes('Generic opener'))).toBe(true);
    });

    it('returns 0 risk for clean human text', () => {
      const result = service.detectAiSlop('We launched a new feature today. It cuts response time from 8 hours to 30 minutes.');
      expect(result.riskScore).toBe(0);
      expect(result.flags).toEqual([]);
    });

    it('caps risk score at 100', () => {
      const sloppy = 'Additionally — leverage our cutting-edge, world-class, best-in-class platform. Furthermore — unlock seamlessly integrated synergy. Moreover — empower your game-changer revolutionary next-gen workflow. ';
      const result = service.detectAiSlop(sloppy.repeat(3));
      expect(result.riskScore).toBe(100);
    });
  });

  describe('critique (LLM-based)', () => {
    it('returns scores normalized to 1-5', async () => {
      mockLlm.completeJson!.mockResolvedValue({
        scores: [
          { dimension: 'philosophy', score: 4, reasoning: 'On brand' },
          { dimension: 'hierarchy', score: 5, reasoning: 'Strong hook' },
          { dimension: 'detail', score: 3, reasoning: 'Could be more specific' },
          { dimension: 'function', score: 4, reasoning: 'Clear CTA' },
          { dimension: 'restraint', score: 4, reasoning: 'No buzzwords' },
        ],
        summary: 'Solid post.',
      });

      const result = await service.critique('Great post', {
        artifactType: 'caption',
      });

      expect(result.scores).toHaveLength(5);
      expect(result.overall).toBe(4);
      expect(result.passed).toBe(true);
      expect(result.failingDimensions).toEqual([]);
    });

    it('flags failing dimensions below 3', async () => {
      mockLlm.completeJson!.mockResolvedValue({
        scores: [
          { dimension: 'philosophy', score: 5, reasoning: '' },
          { dimension: 'hierarchy', score: 2, reasoning: 'Weak hook' },
          { dimension: 'detail', score: 4, reasoning: '' },
          { dimension: 'function', score: 1, reasoning: 'No CTA' },
          { dimension: 'restraint', score: 4, reasoning: '' },
        ],
        summary: 'Hook and CTA need work.',
      });

      const result = await service.critique('Some post', {
        artifactType: 'caption',
      });

      expect(result.passed).toBe(false);
      expect(result.failingDimensions).toContain('hierarchy');
      expect(result.failingDimensions).toContain('function');
    });

    it('clamps out-of-range scores', async () => {
      mockLlm.completeJson!.mockResolvedValue({
        scores: [
          { dimension: 'philosophy', score: 7, reasoning: '' },
          { dimension: 'hierarchy', score: 0, reasoning: '' },
          { dimension: 'detail', score: 3, reasoning: '' },
          { dimension: 'function', score: 3, reasoning: '' },
          { dimension: 'restraint', score: 3, reasoning: '' },
        ],
        summary: '',
      });

      const result = await service.critique('Test', { artifactType: 'caption' });
      expect(result.scores[0].score).toBe(5);
      expect(result.scores[1].score).toBe(1);
    });

    it('fills missing dimensions with neutral score 3', async () => {
      mockLlm.completeJson!.mockResolvedValue({
        scores: [
          { dimension: 'philosophy', score: 4, reasoning: '' },
        ],
        summary: '',
      });

      const result = await service.critique('Test', { artifactType: 'caption' });
      expect(result.scores).toHaveLength(5);
      const restraint = result.scores.find((s) => s.dimension === 'restraint');
      expect(restraint?.score).toBe(3);
    });
  });

  describe('critiqueAndRevise', () => {
    it('returns original when critique passes on first attempt', async () => {
      mockLlm.completeJson!.mockResolvedValue({
        scores: [
          { dimension: 'philosophy', score: 4, reasoning: '' },
          { dimension: 'hierarchy', score: 5, reasoning: '' },
          { dimension: 'detail', score: 4, reasoning: '' },
          { dimension: 'function', score: 4, reasoning: '' },
          { dimension: 'restraint', score: 4, reasoning: '' },
        ],
        summary: 'Solid.',
      });

      const result = await service.critiqueAndRevise('Original content', {
        artifactType: 'caption',
      });

      expect(result.passed).toBe(true);
      expect(result.attempts).toBe(1);
      expect(result.finalContent).toBe('Original content');
      expect(mockLlm.complete).not.toHaveBeenCalled();
    });

    it('revises and rescores when first attempt fails', async () => {
      mockLlm.completeJson!
        .mockResolvedValueOnce({
          scores: [
            { dimension: 'philosophy', score: 2, reasoning: 'Generic' },
            { dimension: 'hierarchy', score: 4, reasoning: '' },
            { dimension: 'detail', score: 4, reasoning: '' },
            { dimension: 'function', score: 4, reasoning: '' },
            { dimension: 'restraint', score: 4, reasoning: '' },
          ],
          summary: 'Off-brand',
        })
        .mockResolvedValueOnce({
          scores: [
            { dimension: 'philosophy', score: 4, reasoning: '' },
            { dimension: 'hierarchy', score: 4, reasoning: '' },
            { dimension: 'detail', score: 4, reasoning: '' },
            { dimension: 'function', score: 4, reasoning: '' },
            { dimension: 'restraint', score: 4, reasoning: '' },
          ],
          summary: 'Better now',
        });

      mockLlm.complete!.mockResolvedValue('Revised on-brand content with specifics');

      const result = await service.critiqueAndRevise('Generic original', {
        artifactType: 'caption',
      });

      expect(result.passed).toBe(true);
      expect(result.attempts).toBe(2);
      expect(result.finalContent).toBe('Revised on-brand content with specifics');
    });

    it('respects maxAttempts cap', async () => {
      mockLlm.completeJson!.mockResolvedValue({
        scores: [
          { dimension: 'philosophy', score: 1, reasoning: 'still bad' },
          { dimension: 'hierarchy', score: 1, reasoning: 'still bad' },
          { dimension: 'detail', score: 1, reasoning: 'still bad' },
          { dimension: 'function', score: 1, reasoning: 'still bad' },
          { dimension: 'restraint', score: 1, reasoning: 'still bad' },
        ],
        summary: 'Cant be fixed',
      });

      mockLlm.complete!.mockResolvedValue('Still terrible content');

      const result = await service.critiqueAndRevise('Original', {
        artifactType: 'caption',
      }, { maxAttempts: 2 });

      expect(result.attempts).toBe(2);
      expect(result.passed).toBe(false);
    });
  });
});
