import { BrandContext } from '../../../brand/brand.service';
import { LLMClient } from '../../llm/llm.service';
import { Angle, EnrichedContext, PlatformDraft } from '../types';
import { buildInstagramPrompt } from '../prompts/adapt-instagram.prompt';
import { buildLinkedinPrompt } from '../prompts/adapt-linkedin.prompt';
import { buildTwitterPrompt } from '../prompts/adapt-twitter.prompt';
import { buildFacebookPrompt } from '../prompts/adapt-facebook.prompt';
import { buildTiktokPrompt } from '../prompts/adapt-tiktok.prompt';

const SUPPORTED_PLATFORMS = ['twitter', 'instagram', 'linkedin', 'facebook', 'tiktok'] as const;
type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

const promptBuilders: Record<SupportedPlatform, (angle: Angle, brand: BrandContext, enriched?: EnrichedContext) => string> = {
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
  enriched?: EnrichedContext,
): Promise<PlatformDraft> {
  const builder = promptBuilders[platform as SupportedPlatform];
  if (!builder) {
    throw new Error(`No prompt builder for platform: ${platform}`);
  }

  const prompt = builder(angle, brand, enriched);
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
  enriched?: EnrichedContext,
): Promise<PlatformDraft[]> {
  const platformSet = platforms.length > 0
    ? platforms
    : SUPPORTED_PLATFORMS;

  const results = await Promise.all(
    platformSet.map((p) => adaptForPlatform(p, angle, brand, llm, enriched)),
  );
  return results;
}