import { BrandContext } from '../../../brand/brand.service';
import { Angle } from '../types';

export function buildTiktokPrompt(angle: Angle, brand: BrandContext): string {
  return `You are writing a TikTok caption for ${brand.brandName}.

BRAND VOICE:
- Tone: ${brand.voice.tone}
- Traits: ${brand.voice.traits.join(', ')}
- Formality: ${brand.voice.formality}/10
- Emoji usage: ${brand.voice.emojiUsage}

AUDIENCE:
- Age: ${brand.audience.age}
- Interests: ${brand.audience.interests.join(', ')}

EXAMPLES OF OUR VOICE (match this energy):
${brand.voiceExamples.slice(0, 5).map((e, i) => `${i + 1}. "${e.content}"`).join('\n') || 'No examples provided yet.'}

ANGLE TO WRITE ABOUT:
Pillar: ${angle.pillar}
Angle: ${angle.angle}

TIKTOK RULES:
- Very short caption (20-60 words max)
- Gen-Z/casual energy (unless brand says otherwise)
- Trending sound suggestion if relevant
- 3-5 hashtags (mix trending + niche)
- Hook must be instant — no warm-up
- Emoji heavy unless brand says otherwise

OUTPUT JSON ONLY:
{
  "hook": "caption opening",
  "body": "rest of caption",
  "cta": "",
  "hashtags": ["tag1", "tag2"],
  "fullCaption": "complete assembled caption"
}`;
}
