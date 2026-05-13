import { BrandContext } from '../../../brand/brand.service';
import { Angle, EnrichedContext } from '../types';
import { getHooksForPlatform, formatHooksForPrompt } from '../hooks/hook-library';

export function buildLinkedinPrompt(angle: Angle, brand: BrandContext, enriched?: EnrichedContext): string {
  const hooks = getHooksForPlatform('linkedin', 4);
  const competitorContext = enriched?.competitorInsights
    ?.filter(c => c.platform === 'linkedin')
    .map(c => `@${c.handle}: focuses on ${c.topTopics.slice(0, 2).join(', ')} | weakness: ${c.weaknesses[0] ?? 'generic content'}`)
    .slice(0, 2) ?? [];

  return `You are writing a LinkedIn post that gets people to click "see more" and leave a comment. You write like a founder sharing hard-won lessons, not like a content marketer.

BRAND: ${brand.brandName} (${brand.industry})
VOICE: ${brand.voice.tone} | Formality: ${brand.voice.formality}/10
TRAITS: ${brand.voice.traits.join(', ')}
MUST USE: ${brand.voice.alwaysWords.join(', ') || 'none'}
NEVER USE: ${brand.voice.neverWords.join(', ') || 'none'}

AUDIENCE: ${brand.audience.age} professionals
THEY CARE ABOUT: ${brand.audience.interests.join(', ')}
THEIR FRUSTRATION: ${brand.audience.painPoints.join(', ')}

${brand.voiceExamples.length ? `MATCH THIS VOICE:\n${brand.voiceExamples.slice(0, 3).map((e, i) => `${i + 1}. "${e.content}"`).join('\n')}` : ''}

THE ANGLE:
"${angle.angle}"
Hook format: ${angle.hookFormat || 'vulnerable or contrarian'}
Specific detail: ${angle.specificDetails || 'include a real lesson or number'}

${competitorContext.length ? `COMPETITORS ON LINKEDIN (differentiate from them):\n${competitorContext.join('\n')}` : ''}

HOOK TEMPLATES:
${formatHooksForPrompt(hooks)}

LINKEDIN RULES:
- STRICT: fullCaption MUST be 300 characters or fewer
- First line MUST make them click "see more" — bold claim, vulnerable confession, or surprising stat
- Write in first person. "I" not "We" (unless it's a team story)
- Short paragraphs. One idea per line. White space matters.
- End with a QUESTION that people actually want to answer (not "What do you think?" — that's lazy)
- 1 hashtag max (LinkedIn algorithm doesn't favor more)
- NO emojis (unless brand voice explicitly says otherwise)
- NO: "I'm excited to announce", "Thrilled to share", "In the ever-evolving landscape"
- Sound like a real person sharing a real experience, not a brand posting content

OUTPUT JSON ONLY:
{
  "hook": "the bold first line that triggers 'see more'",
  "body": "the story/lesson (short paragraphs, first person)",
  "cta": "a specific question people want to answer",
  "hashtags": ["onetag"],
  "fullCaption": "complete post (300 chars max)"
}`;
}