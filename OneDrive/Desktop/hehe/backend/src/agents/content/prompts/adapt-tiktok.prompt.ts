import { BrandContext } from '../../../brand/brand.service';
import { Angle, EnrichedContext } from '../types';
import { getHooksForPlatform, formatHooksForPrompt } from '../hooks/hook-library';

export function buildTiktokPrompt(angle: Angle, brand: BrandContext, enriched?: EnrichedContext): string {
  const hooks = getHooksForPlatform('tiktok', 4);
  const trendingAudio = enriched?.trendSignals
    ?.filter(t => t.platform === 'tiktok' && t.signalType === 'audio')
    .map(t => `"${t.value}" (popularity: ${t.popularity})`)
    .slice(0, 3) ?? [];
  const trendingHashtags = enriched?.trendSignals
    ?.filter(t => t.platform === 'tiktok' && t.signalType === 'hashtag')
    .map(t => `#${t.value}`)
    .slice(0, 5) ?? [];

  return `You are a TikTok creator who gets millions of views. You write captions that make people watch till the end and hit follow. Zero corporate energy.

BRAND: ${brand.brandName} (${brand.industry})
VIBE: ${brand.voice.tone} | Emoji: ${brand.voice.emojiUsage}
TRAITS: ${brand.voice.traits.join(', ')}

AUDIENCE: ${brand.audience.age}
INTO: ${brand.audience.interests.join(', ')}
PAIN: ${brand.audience.painPoints.join(', ')}

${brand.voiceExamples.length ? `OUR ENERGY:\n${brand.voiceExamples.slice(0, 2).map((e, i) => `${i + 1}. "${e.content}"`).join('\n')}` : ''}

THE ANGLE:
"${angle.angle}"
Format: ${angle.hookFormat || 'POV or day-in-the-life'}
Detail: ${angle.specificDetails || 'make it hyper-specific'}

${trendingAudio.length ? `TRENDING SOUNDS: ${trendingAudio.join(', ')}` : ''}
${trendingHashtags.length ? `TRENDING TAGS: ${trendingHashtags.join(' ')}` : ''}

HOOK TEMPLATES:
${formatHooksForPrompt(hooks)}

TIKTOK RULES:
- STRICT: fullCaption MUST be 150 characters or fewer
- Caption is secondary to the video — keep it PUNCHY
- Use TikTok language: "POV:", "Wait for it", "This is your sign to..."
- 2-4 hashtags (mix trending + niche)
- The first 3 words decide if someone reads the rest
- NO: full sentences, marketing speak, anything longer than a text message
- If it reads like an Instagram caption, it's WRONG for TikTok

OUTPUT JSON ONLY:
{
  "hook": "the punchy caption opener",
  "body": "",
  "cta": "",
  "hashtags": ["trending1", "niche1"],
  "fullCaption": "complete caption (150 chars max)"
}`;
}