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

FACEBOOK RULES:
- STRICT: fullCaption MUST be 250 characters or fewer
- Friendly, shareable hook that stops the scroll
- Narrative/storytelling approach works best
- 150-250 chars total
- Clear CTA (comment, share, click link)
- Use line breaks for scannability
- 1-3 hashtags
- Match emoji usage: ${brand.voice.emojiUsage}

OUTPUT JSON ONLY:
{
  "hook": "opening line",
  "body": "main story/narrative",
  "cta": "call to action",
  "hashtags": ["tag1", "tag2"],
  "fullCaption": "complete assembled post (250 chars max)"
}`;
}