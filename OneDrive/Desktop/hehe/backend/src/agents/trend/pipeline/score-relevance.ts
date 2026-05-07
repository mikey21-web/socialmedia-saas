import { BrandContext } from '../../../brand/brand.service';
import { LlmService } from '../../../agents/llm/llm.service';
import { RawTrend } from '../sources/rss.source';
import { buildScorePrompt } from '../prompts/score.prompt';

export interface ScoredTrend extends RawTrend {
  relevanceScore: number;
  brandFitReason: string;
  pillar: string | null;
}

export async function scoreRelevance(
  trends: RawTrend[],
  brand: BrandContext,
  llm: LlmService,
): Promise<ScoredTrend[]> {
  if (trends.length === 0) return [];

  const BATCH_SIZE = 20;
  const scored: ScoredTrend[] = [];

  for (let i = 0; i < trends.length; i += BATCH_SIZE) {
    const batch = trends.slice(i, i + BATCH_SIZE);
    const prompt = buildScorePrompt(batch, brand);

    const results = await llm.completeJson<
      Array<{ index: number; score: number; reason: string; pillar: string | null }>
    >(prompt, { temperature: 0.3 });

    for (const r of results) {
      const trend = batch[r.index];
      if (!trend || r.score < 5) continue;

      scored.push({
        ...trend,
        relevanceScore: r.score,
        brandFitReason: r.reason,
        pillar: r.pillar ?? null,
      });
    }
  }

  return scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
}
