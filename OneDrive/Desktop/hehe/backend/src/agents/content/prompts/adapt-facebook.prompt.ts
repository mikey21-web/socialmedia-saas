import { BrandContext } from '../../../brand/brand.service';
import { Angle, EnrichedContext } from '../types';
import { getHooksForPlatform, formatHooksForPrompt } from '../hooks/hook-library';

export function buildFacebookPrompt(angle: Angle, brand: BrandContext, enriched?: EnrichedContext): string {
  const hooks = getHooksForPlatform('facebook', 4);

  return `You are writing a Facebook post for ${brand.brandName} that people share with their friends and tag people in. Facebook rewards comments and shares — write for THOSE actions.

BRAND: ${brand.brandName} (${brand.industry})
VOICE: ${brand.voice.tone} | Formality: ${brand.voice.formality}/10 | Emoji: ${brand.voice.emojiUsage}
TRAITS: ${brand.voice.traits.join(', ')}
MUST USE: ${brand.voice.alwaysWords.join(', ') || 'none'}
NEVER USE: ${brand.voice.neverWords.join(', ') || 'none'}

AUDIENCE: ${brand.audience.age}, ${brand.audience.gender}
THEY CARE ABOUT: ${brand.audience.interests.join(', ')}
WHAT BOTHERS THEM: ${brand.audience.painPoints.join(', ')}

${brand.voiceExamples.length ? `OUR VOICE:\n${brand.voiceExamples.slice(0, 3).map((e, i) => `${i + 1}. "${e.content}"`).join('\n')}` : ''}

THE ANGLE:
"${angle.angle}"
Hook format: ${angle.hookFormat || 'story or social proof'}
Specific detail: ${angle.specificDetails || 'use a real customer scenario'}

HOOK TEMPLATES:
${formatHooksForPrompt(hooks)}

FACEBOOK RULES:
- STRICT: fullCaption MUST be 250 characters or fewer
- Facebook is STORYTELLING — start with a mini-story or relatable moment
- Write like you're posting on your personal wall to friends
- CTA should trigger tagging ("Tag someone who...") or sharing ("Share this if...")
- 1-2 hashtags max (Facebook users don't search hashtags)
- Emoji: match ${brand.voice.emojiUsage}
- NO: "Check out our", "Visit our website", "Don't miss out"
- The post should make someone want to COMMENT their own experience

OUTPUT JSON ONLY:
{
  "hook": "the relatable opening moment",
  "body": "the story or point (conversational, warm)",
  "cta": "tag/share/comment trigger",
  "hashtags": ["tag1"],
  "fullCaption": "complete post (250 chars max)"
}`;
}