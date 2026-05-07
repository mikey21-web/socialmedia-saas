import { BrandContext } from '../../../brand/brand.service';

export interface CompetitorSnapshotData {
  name: string;
  platform: string;
  topPosts: Array<{ content?: string; likes?: number; comments?: number }>;
}

export function buildDigestPrompt(
  snapshots: CompetitorSnapshotData[],
  brand: BrandContext,
): string {
  const snapshotText = snapshots
    .map(
      (s) =>
        `COMPETITOR: ${s.name} (${s.platform})\n` +
        s.topPosts
          .slice(0, 5)
          .map(
            (p, i) =>
              `  Post ${i + 1}: "${(p.content ?? '').slice(0, 200)}" | likes: ${p.likes ?? 0} | comments: ${p.comments ?? 0}`,
          )
          .join('\n'),
    )
    .join('\n\n');

  return `You are a competitive intelligence analyst for ${brand.brandName}.

BRAND CONTEXT:
- Industry: ${brand.industry}
- Content Pillars: ${brand.pillars.map((p: { name: string }) => p.name).join(', ')}
- Primary Goal: ${brand.goals.primary}
- Audience: ${brand.audience.age}, interests: ${brand.audience.interests.join(', ')}

COMPETITOR ACTIVITY THIS WEEK:
${snapshotText}

Analyze this data and produce a weekly competitor digest.

OUTPUT JSON ONLY:
{
  "summary": "2-3 sentence overview of what competitors did this week",
  "topPerforming": [
    { "competitor": "name", "what": "what they posted", "why": "why it worked" }
  ],
  "gaps": [
    { "opportunity": "content topic or format competitors ignored", "reason": "why you should own this" }
  ],
  "watchOut": "one threat or trend to be aware of",
  "recommendation": "one specific action ${brand.brandName} should take this week"
}`;
}
