import { BrandContext } from '../../../brand/brand.service';
import { Angle } from '../types';

export function buildFacebookPrompt(angle: Angle, brand: BrandContext): string {
  return `You are writing a Facebook post for ${brand.brandName}.

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
- Pain points: ${brand.audience.painPoints.join(', ')}

EXAMPLES OF OUR VOICE (match this energy):
${brand.voiceExamples.slice(0, 5).map((e, i) => `${i + 1}. "${e.content}"`).join('\n') || 'No examples provided yet.'}

ANGLE TO WRITE ABOUT:
Pillar: ${angle.pillar}
Angle: ${angle.angle}

FACEBOOK RULES:
- Narrative/storytelling approach works best
- 80-200 words
- Clear CTA (comment, share, click link)
- Use line breaks for scannability
- 2-4 hashtags
- Match emoji usage: ${brand.voice.emojiUsage}

OUTPUT JSON ONLY:
{
  "hook": "opening line",
  "body": "main story/narrative",
  "cta": "call to action",
  "hashtags": ["tag1", "tag2"],
  "fullCaption": "complete assembled post"
}`;
}
