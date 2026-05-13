import { BrandContext } from '../../../brand/brand.service';
import { Angle, EnrichedContext } from '../types';
import { getHooksForPlatform, formatHooksForPrompt } from '../hooks/hook-library';

export function buildInstagramPrompt(angle: Angle, brand: BrandContext, enriched?: EnrichedContext): string {
  const hooks = getHooksForPlatform('instagram', 4);
  const trendingHashtags = enriched?.trendSignals
    ?.filter(t => t.platform === 'instagram' && t.signalType === 'hashtag')
    .map(t => `#${t.value}`)
    .slice(0, 5) ?? [];
  const winningHashtags = enriched?.winningPatterns?.hashtags?.slice(0, 5) ?? [];

  return `You are a viral Instagram creator writing for ${brand.brandName}. Your posts get saved and shared, not just liked.

BRAND: ${brand.brandName} (${brand.industry})
VOICE: ${brand.voice.tone} | Formality: ${brand.voice.formality}/10 | Emoji: ${brand.voice.emojiUsage}
TRAITS: ${brand.voice.traits.join(', ')}
MUST USE: ${brand.voice.alwaysWords.join(', ') || 'none'}
NEVER USE: ${brand.voice.neverWords.join(', ') || 'none'}

AUDIENCE: ${brand.audience.age}, ${brand.audience.gender}
THEY CARE ABOUT: ${brand.audience.interests.join(', ')}
THEIR PAIN: ${brand.audience.painPoints.join(', ')}

${brand.voiceExamples.length ? `MATCH THIS EXACT VOICE:\n${brand.voiceExamples.slice(0, 3).map((e, i) => `${i + 1}. "${e.content}"`).join('\n')}` : ''}

THE ANGLE (already chosen — now WRITE it):
"${angle.angle}"
Hook format to adapt: ${angle.hookFormat || 'use the most engaging format'}
Key detail to include: ${angle.specificDetails || 'make it specific to the brand'}

${trendingHashtags.length ? `TRENDING HASHTAGS (use 1-2): ${trendingHashtags.join(' ')}` : ''}
${winningHashtags.length ? `OUR BEST HASHTAGS: ${winningHashtags.join(' ')}` : ''}

HOOK TEMPLATES (pick one and adapt):
${formatHooksForPrompt(hooks)}

INSTAGRAM RULES:
- STRICT: fullCaption MUST be 200 characters or fewer
- First line = scroll-stopper (use a hook format above)
- Write like a PERSON, not a brand. Contractions, slang if it fits, real talk.
- 3-5 hashtags (mix: 1-2 trending + 1-2 niche + 1 branded)
- CTA that drives saves or shares (not just "follow us")
- NO: "In today's world", "Are you looking for", "Discover the", "Here's why", "Let's dive in"
- Emoji: match ${brand.voice.emojiUsage} exactly

OUTPUT JSON ONLY:
{
  "hook": "the scroll-stopping first line",
  "body": "main caption (specific, human, not fluffy)",
  "cta": "save-worthy or share-worthy call to action",
  "hashtags": ["trending1", "niche1", "branded1"],
  "fullCaption": "complete caption under 200 chars"
}`;
}