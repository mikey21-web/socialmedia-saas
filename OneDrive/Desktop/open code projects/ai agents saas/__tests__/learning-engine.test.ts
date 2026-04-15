import { LearningEngine } from '@/lib/agents/learning-engine';

describe('Learning Engine', () => {
  let engine: LearningEngine;

  beforeEach(() => {
    engine = new LearningEngine();
  });

  it('should record feedback correctly', async () => {
    await engine.recordFeedback(
      'run-1',
      'agent-1',
      'user-1',
      'real_estate',
      'real_estate'
    );
    const stats = await engine.getFeedbackStats('agent-1');
    expect(stats.count).toBe(1);
  });

  it('should calculate accuracy correctly', async () => {
    await engine.recordFeedback('run-1', 'agent-1', 'user-1', 'real_estate', 'real_estate');
    await engine.recordFeedback('run-2', 'agent-1', 'user-1', 'ecommerce', 'ecommerce');
    await engine.recordFeedback('run-3', 'agent-1', 'user-1', 'coaching', 'real_estate');

    const stats = await engine.getFeedbackStats('agent-1');
    expect(stats.accuracy).toBe(2/3); // 2 correct, 1 wrong
  });

  it('should trigger refinement when accuracy drops', async () => {
    for (let i = 0; i < 7; i++) {
      await engine.recordFeedback(
        `run-${i}`,
        'agent-1',
        'user-1',
        'wrong-prediction',
        i < 2 ? 'wrong-prediction' : 'correct-value' // 2 correct, 5 wrong = 28% accuracy
      );
    }
    const stats = await engine.getFeedbackStats('agent-1');
    expect(stats.accuracy).toBeLessThan(0.7);
  });

  it('should track per-agent feedback separately', async () => {
    await engine.recordFeedback('run-1', 'agent-1', 'user-1', 'pred1', 'pred1');
    await engine.recordFeedback('run-2', 'agent-2', 'user-1', 'pred2', 'wrong');

    const stats1 = await engine.getFeedbackStats('agent-1');
    const stats2 = await engine.getFeedbackStats('agent-2');

    expect(stats1.accuracy).toBe(1.0);
    expect(stats2.accuracy).toBe(0.0);
  });
});
