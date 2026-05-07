import { BrandContext } from '../../../brand/brand.service';
import { Angle } from '../types';

export function buildTwitterPrompt(angle: Angle, brand: BrandContext): string {
  return `You are writing a tweet/X post for ${brand.brandName}.

BRAND VOICE:
- Tone: ${brand.voice.tone}
- Traits: ${brand.voice.traits.join(', ')}
- Formality: ${brand.voice.formality}/10
- Always use words like: ${brand.voice.alwaysWords.join(', ') || 'none specified'}
- NEVER use these words: ${brand.voice.neverWords.join(', ') || 'none specified'}
- Emoji usage: ${brand.voice.emojiUsage}

AUDIENCE:
- Age: ${brand.audience.age}
- Interests: ${brand.audience.interests.join(', ')}

EXAMPLES OF OUR VOICE (match this energy):
${brand.voiceExamples.slice(0, 5).map((e, i) => `${i + 1}. "${e.content}"`).join('\n') || 'No examples provided yet.'}

ANGLE TO WRITE ABOUT:
Pillar: ${angle.pillar}
Angle: ${angle.angle}

TWITTER/X RULES:
- Max 280 characters for main tweet
- Punchy, high-impact language
- No fluff, every word earns its place
- Optional: suggest a thread (2-3 follow-up tweets)
- 1-2 hashtags max
- Match emoji usage: ${brand.voice.emojiUsage}

OUTPUT JSON ONLY:
{
  "hook": "the tweet itself (under 280 chars)",
  "body": "",
  "cta": "",
  "hashtags": ["tag1"],
  "fullCaption": "the complete tweet with hashtags"
}`;
}
