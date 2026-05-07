import { BrandContext } from '../../../brand/brand.service';

export function buildIdeatePrompt(
  input: { topic: string; intent?: string },
  brand: BrandContext,
): string {
  const pillarsText = brand.pillars.length
    ? brand.pillars.map((p) => `- ${p.name} (${p.weight}%): ${p.description}`).join('\n')
    : '- No pillars defined yet';

  return `You are a senior social media strategist for ${brand.brandName} (${brand.industry}).

BRAND DESCRIPTION: ${brand.description}

CONTENT PILLARS:
${pillarsText}

AUDIENCE:
- Age: ${brand.audience.age}
- Gender: ${brand.audience.gender}
- Interests: ${brand.audience.interests.join(', ') || 'not specified'}
- Pain points: ${brand.audience.painPoints.join(', ') || 'not specified'}

GOAL: ${brand.goals.primary}

TOPIC: ${input.topic}
${input.intent ? `INTENT: ${input.intent}` : ''}

Generate exactly 3 unique content angles for this topic. Each angle should:
1. Map to one of the brand's content pillars (or suggest a relevant pillar if none fit)
2. Be specific and actionable (not generic)
3. Have a clear hook that would stop a scroll
4. Include a brand-fit score from 1-10

OUTPUT JSON ONLY:
{
  "angles": [
    {
      "pillar": "pillar name",
      "angle": "specific angle description",
      "reasoning": "why this works for the brand and audience",
      "brandFitScore": 8
    }
  ]
}`;
}
