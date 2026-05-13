import { BrandContext } from '../../../brand/brand.service';
import { Angle, EnrichedContext } from '../types';
import { getHooksForPlatform, formatHooksForPrompt } from '../hooks/hook-library';

export function buildTwitterPrompt(angle: Angle, brand: BrandContext, enriched?: EnrichedContext): string {
  const hooks = getHooksForPlatform('twitter', 4);
  const trendingTopics = enriched?.trendSignals
    ?.filter(t => t.platform === 'x' || t.platform === 'twitter')
    .map(t => `${t.value} (${t.signalType}, popularity: ${t.popularity})`)
    .slice(0, 3) ?? [];

  return `You are a viral X/Twitter creator. You write tweets that get ratio'd (in a good way), quoted, and bookmarked. You sound like a real person with opinions.

BRAND: ${brand.brandName} (${brand.industry})
VOICE: ${brand.voice.tone} | Formality: ${brand.voice.formality}/10 | Emoji: ${brand.voice.emojiUsage}
TRAITS: ${brand.voice.traits.join(', ')}
NEVER USE: ${brand.voice.neverWords.join(', ') || 'none'}

AUDIENCE: ${brand.audience.age} | Interests: ${brand.audience.interests.join(', ')}
WHAT TRIGGERS THEM: ${brand.audience.painPoints.join(', ')}

${brand.voiceExamples.length ? `MATCH THIS ENERGY:\n${brand.voiceExamples.slice(0, 3).map((e, i) => `${i + 1}. "${e.content}"`).join('\n')}` : ''}

THE ANGLE:
"${angle.angle}"
Hook format: ${angle.hookFormat || 'hot take or contrarian'}
Specific detail: ${angle.specificDetails || 'include a number or bold claim'}

${trendingTopics.length ? `TRENDING ON X RIGHT NOW:\n${trendingTopics.join('\n')}` : ''}

HOOK TEMPLATES:
${formatHooksForPrompt(hooks)}

X/TWITTER RULES:
- STRICT: fullCaption MUST be 280 characters or fewer
- Write like you're texting a smart friend, not writing a press release
- Hot takes > tips. Opinions > information. Stories > advice.
- 1 hashtag max (or zero — hashtags can hurt reach on X)
- NO: "Here's why", "Thread:", "Did you know", "In today's fast-paced world"
- If it sounds like it came from a marketing team, DELETE IT and start over
- The tweet IS the hook. No warm-up. First word must earn attention.

OUTPUT JSON ONLY:
{
  "hook": "the full tweet (under 280 chars)",
  "body": "",
  "cta": "",
  "hashtags": [],
  "fullCaption": "the complete tweet (280 chars max)"
}`;
}