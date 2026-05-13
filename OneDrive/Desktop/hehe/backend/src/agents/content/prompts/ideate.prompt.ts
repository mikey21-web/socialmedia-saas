import { BrandContext } from '../../../brand/brand.service';
import { EnrichedContext } from '../types';
import { getHooksForPlatform, formatHooksForPrompt } from '../hooks/hook-library';

export function buildIdeatePrompt(
  input: { topic: string; intent?: string },
  brand: BrandContext,
  enriched?: EnrichedContext,
  targetPlatform?: string,
): string {
  const pillarsText = brand.pillars.length
    ? brand.pillars.map((p) => `- ${p.name} (${p.weight}%): ${p.description} [keywords: ${p.keywords.join(', ')}]`).join('\n')
    : '- No pillars defined yet';

  const hooks = getHooksForPlatform(targetPlatform ?? 'instagram', 6);
  const hooksText = formatHooksForPrompt(hooks);

  const topPerformersText = enriched?.recentTopPerformers?.length
    ? enriched.recentTopPerformers.slice(0, 5).map(p =>
        `- "${p.title}" → ${p.impressions.toLocaleString()} impressions${p.platform ? ` (${p.platform})` : ''}`
      ).join('\n')
    : 'No performance data yet — focus on proven viral formats';

  const flopsText = enriched?.recentFlops?.length
    ? enriched.recentFlops.slice(0, 3).map(p =>
        `- "${p.title}" → only ${p.impressions} impressions${p.reason ? ` (${p.reason})` : ''}`
      ).join('\n')
    : '';

  const winningPatternsText = enriched?.winningPatterns
    ? `WINNING TOPICS: ${enriched.winningPatterns.topics.join(', ')}
WINNING FORMATS: ${enriched.winningPatterns.formats.join(', ')}
WINNING HASHTAGS: ${enriched.winningPatterns.hashtags.join(', ')}`
    : '';

  const competitorGapsText = enriched?.competitorInsights?.length
    ? enriched.competitorInsights.slice(0, 3).map(c =>
        `- @${c.handle} (${c.platform}): talks about ${c.topTopics.slice(0, 3).join(', ')} | engagement: ${c.engagementRate} | weakness: ${c.weaknesses[0] ?? 'unknown'}`
      ).join('\n')
    : '';

  const trendsText = enriched?.trendSignals?.length
    ? enriched.trendSignals.slice(0, 5).map(t =>
        `- ${t.value} (${t.signalType} on ${t.platform}, popularity: ${t.popularity}, velocity: ${t.velocity > 0 ? '↑ rising' : '→ stable'})`
      ).join('\n')
    : '';

  const voiceExamplesText = brand.voiceExamples.length
    ? brand.voiceExamples.slice(0, 5).map((e, i) =>
        `${i + 1}. "${e.content}"${e.platform ? ` [${e.platform}]` : ''}`
      ).join('\n')
    : '';

  return `You are a viral content strategist who has grown 50+ brands on social media. You think like a creator, not a marketer. Your content gets saved, shared, and argued about.

BRAND: ${brand.brandName} (${brand.industry})
"${brand.description}"

CONTENT PILLARS:
${pillarsText}

AUDIENCE (write DIRECTLY to these people):
- Age: ${brand.audience.age} | Gender: ${brand.audience.gender}
- They care about: ${brand.audience.interests.join(', ') || 'not specified'}
- What keeps them up at night: ${brand.audience.painPoints.join(', ') || 'not specified'}
- They scroll past: generic tips, corporate language, anything that sounds like ChatGPT

GOAL: ${brand.goals.primary}
${brand.goals.secondary.length ? `SECONDARY: ${brand.goals.secondary.join(', ')}` : ''}

${topPerformersText ? `OUR TOP PERFORMING CONTENT (do MORE of this):\n${topPerformersText}` : ''}
${flopsText ? `\nCONTENT THAT FLOPPED (AVOID this approach):\n${flopsText}` : ''}
${winningPatternsText ? `\n${winningPatternsText}` : ''}
${competitorGapsText ? `\nCOMPETITOR LANDSCAPE (find gaps they're missing):\n${competitorGapsText}` : ''}
${trendsText ? `\nTRENDING RIGHT NOW (ride these waves):\n${trendsText}` : ''}
${voiceExamplesText ? `\nOUR VOICE (match this exact energy):\n${voiceExamplesText}` : ''}

PROVEN HOOK FORMATS (adapt one of these):
${hooksText}

TOPIC: ${input.topic}
${input.intent ? `INTENT: ${input.intent}` : ''}

Generate exactly 3 content angles. RULES:
1. Each angle MUST use a specific hook format from the list above (adapted to the brand)
2. Each angle MUST include a SPECIFIC detail — a number, a story, a contrarian take, or a real scenario. "Tips for better engagement" is BANNED. "We tested 3 posting times and found 7AM beats 9PM by 2x" is what I want.
3. Each angle should feel like something a real human would post, not a marketing department
4. If there's trending data, at least 1 angle should ride a trend
5. If there's competitor data, at least 1 angle should exploit a gap they're missing
6. Score viralityScore based on how likely this is to get shares/saves (not just likes)
7. Score noveltyScore based on how different this is from what the brand usually posts

OUTPUT JSON ONLY:
{
  "angles": [
    {
      "pillar": "pillar name",
      "angle": "the SPECIFIC angle with detail (not vague)",
      "hookFormat": "which hook format from the list you're adapting",
      "specificDetails": "the exact number, story, or contrarian take that makes this specific",
      "reasoning": "why this will perform — reference data if available",
      "brandFitScore": 8,
      "viralityScore": 9,
      "noveltyScore": 7,
      "trendAligned": false
    }
  ]
}`;
}
