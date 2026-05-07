import { BrandContext } from '../../../brand/brand.service';
import { LLMClient } from '../../llm/llm.service';
import { IdeationResult } from '../types';
import { buildIdeatePrompt } from '../prompts/ideate.prompt';

export async function ideate(
  input: { topic: string; intent?: string },
  brand: BrandContext,
  llm: LLMClient,
): Promise<IdeationResult> {
  const prompt = buildIdeatePrompt(input, brand);
  const result = await llm.completeJson<IdeationResult>(prompt);

  if (!result.angles || !Array.isArray(result.angles)) {
    return { angles: [] };
  }

  return result;
}
