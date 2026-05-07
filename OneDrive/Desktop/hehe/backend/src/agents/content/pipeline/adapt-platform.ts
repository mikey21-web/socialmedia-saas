import { BrandContext } from '../../../brand/brand.service';
import { LLMClient } from '../../llm/llm.service';
import { Angle, PlatformDraft } from '../types';
import { buildInstagramPrompt } from '../prompts/adapt-instagram.prompt';
import { buildLinkedinPrompt } from '../prompts/adapt-linkedin.prompt';
import { buildTwitterPrompt } from '../prompts/adapt-twitter.prompt';
import { buildFacebookPrompt } from '../prompts/adapt-facebook.prompt';
import { buildTiktokPrompt } from '../prompts/adapt-tiktok.prompt';

const promptBuilders: Record<string, (angle: Angle, brand: BrandContext) => string> = {
  instagram: buildInstagramPrompt,
  linkedin: buildLinkedinPrompt,
  twitter: buildTwitterPrompt,
  facebook: buildFacebookPrompt,
  tiktok: buildTiktokPrompt,
};

export async function adaptForPlatform(
  platform: string,
  angle: Angle,
  brand: BrandContext,
  llm: LLMClient,
): Promise<PlatformDraft> {
  const builder = promptBuilders[platform];
  if (!builder) {
    throw new Error(`No prompt builder for platform: ${platform}`);
  }

  const prompt = builder(angle, brand);
  const draft = await llm.completeJson<PlatformDraft>(prompt);

  return {
    ...draft,
    platform,
  };
}

export async function adaptForAllPlatforms(
  platforms: string[],
  angle: Angle,
  brand: BrandContext,
  llm: LLMClient,
): Promise<PlatformDraft[]> {
  const results = await Promise.all(
    platforms.map((p) => adaptForPlatform(p, angle, brand, llm)),
  );
  return results;
}
