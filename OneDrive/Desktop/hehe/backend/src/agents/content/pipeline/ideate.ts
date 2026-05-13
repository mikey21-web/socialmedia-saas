import { BrandContext } from '../../../brand/brand.service';
import { LLMClient } from '../../llm/llm.service';
import { EnrichedContext, IdeationResult } from '../types';
import { buildIdeatePrompt } from '../prompts/ideate.prompt';

export async function ideate(
  input: { topic: string; intent?: string },
  brand: BrandContext,
  llm: LLMClient,
  enriched?: EnrichedContext,
  targetPlatform?: string,
): Promise<IdeationResult> {
  const prompt = buildIdeatePrompt(input, brand, enriched, targetPlatform);
  const result = await llm.completeJson<IdeationResult>(prompt);

  if (!result.angles || !Array.isArray(result.angles)) {
    return { angles: [] };
  }

  return result;
}
