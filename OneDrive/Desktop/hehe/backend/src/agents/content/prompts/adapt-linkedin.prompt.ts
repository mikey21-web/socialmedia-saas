import { BrandContext } from '../../../brand/brand.service';
import { Angle } from '../types';

export function buildLinkedinPrompt(angle: Angle, brand: BrandContext): string {
  return `You are writing a LinkedIn post for ${brand.brandName}.

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

LINKEDIN RULES:
- Start with a bold hook line (makes people click "see more")
- Personal or thought-leadership angle
- 100-200 words
- NO hashtag spam (max 3 hashtags)
- End with a question or discussion prompt for engagement
- Use line breaks for readability
- Professional yet human tone

OUTPUT JSON ONLY:
{
  "hook": "first line",
  "body": "main post content",
  "cta": "engagement question or call to action",
  "hashtags": ["tag1", "tag2"],
  "fullCaption": "complete assembled post"
}`;
}
