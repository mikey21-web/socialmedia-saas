import { BrandContext } from '../../../brand/brand.service';
import { RawTrend } from '../sources/rss.source';

export function buildScorePrompt(trends: RawTrend[], brand: BrandContext): string {
  return `You are a social media strategist scoring news trends for brand relevance.

BRAND: ${brand.brandName}
INDUSTRY: ${brand.industry}
DESCRIPTION: ${brand.description}
TARGET AUDIENCE: ${brand.audience.age}, interests: ${brand.audience.interests.join(', ')}
CONTENT PILLARS: ${brand.pillars.map((p: { name: string }) => p.name).join(', ')}
PRIMARY GOAL: ${brand.goals.primary}

TRENDS TO SCORE (${trends.length} items):
${trends.map((t, i) => `${i}. TITLE: "${t.title}"\n   SUMMARY: "${t.summary.slice(0, 200)}"`).join('\n\n')}

For each trend, score 0-10 on brand relevance. Only include score >= 5.

OUTPUT JSON ONLY — array of scored trends:
[
  {
    "index": 0,
    "score": 8.5,
    "reason": "Why this fits the brand in one sentence",
    "pillar": "which content pillar this fits (or null)"
  }
]

Return empty array [] if no trends score >= 5.`;
}
