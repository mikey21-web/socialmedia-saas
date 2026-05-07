import { BrandContext } from '../../../brand/brand.service';
import { Angle } from '../types';

export function buildInstagramPrompt(angle: Angle, brand: BrandContext): string {
  return `You are writing an Instagram caption for ${brand.brandName}.

BRAND VOICE:
- Tone: ${brand.voice.tone}
- Traits: ${brand.voice.traits.join(', ')}
- Formality: ${brand.voice.formality}/10
- Always use words like: ${brand.voice.alwaysWords.join(', ') || 'none specified'}
- NEVER use these words: ${brand.voice.neverWords.join(', ') || 'none specified'}
- Emoji usage: ${brand.voice.emojiUsage}
- Hashtag style: ${brand.voice.hashtagStyle}

AUDIENCE:
- Age: ${brand.audience.age}
- Interests: ${brand.audience.interests.join(', ')}
- Pain points: ${brand.audience.painPoints.join(', ')}

EXAMPLES OF OUR VOICE (match this energy):
${brand.voiceExamples.slice(0, 5).map((e, i) => `${i + 1}. "${e.content}"`).join('\n') || 'No examples provided yet.'}

ANGLE TO WRITE ABOUT:
Pillar: ${angle.pillar}
Angle: ${angle.angle}

INSTAGRAM RULES:
- Hook in first line that stops the scroll
- 80-150 words ideal
- 5-8 hashtags at the end (mix niche + broad)
- Strong CTA last line
- Match emoji usage exactly: ${brand.voice.emojiUsage}

OUTPUT JSON ONLY:
{
  "hook": "first line",
  "body": "main caption",
  "cta": "call to action",
  "hashtags": ["tag1", "tag2"],
  "fullCaption": "complete assembled caption"
}`;
}
