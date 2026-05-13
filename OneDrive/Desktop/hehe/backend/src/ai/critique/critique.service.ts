import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../agents/llm/llm.service';

/**
 * Five-Dimensional Self-Critique
 * Adapted from Open Design (Apache-2.0) and the huashu-design playbook.
 * Source: https://github.com/nexu-io/open-design (apps/daemon/src/prompts/discovery.ts)
 *         https://github.com/alchaincyf/huashu-design
 *
 * Before any AI-generated artifact is emitted to the user, we silently score
 * it 1-5 across five dimensions. Anything below 3 in any dimension means the
 * artifact is regressing — fix it and rescore. Two passes is normal.
 *
 * This is the single biggest quality gate in the system.
 */

export type CritiqueDimension =
  | 'philosophy'    // Does it follow brand voice? Stay on-pillar? Match the audience?
  | 'hierarchy'     // Is the hook landing first? CTA last? Most important info prominent?
  | 'detail'        // Specifics, real numbers, concrete examples — not vague AI fluff?
  | 'function'      // Does it achieve the stated goal? (drive clicks, build trust, etc)
  | 'restraint';    // No AI-slop tells (em-dashes, "Additionally", forced rule-of-three)?

export interface CritiqueScore {
  dimension: CritiqueDimension;
  score: 1 | 2 | 3 | 4 | 5;
  reasoning: string;
  suggestion?: string;
}

export interface CritiqueResult {
  scores: CritiqueScore[];
  overall: number;          // average
  failingDimensions: CritiqueDimension[];  // < 3
  passed: boolean;
  summary: string;
}

export interface CritiqueContext {
  artifactType:
    | 'caption'
    | 'carousel_slide'
    | 'video_script'
    | 'reply'
    | 'email'
    | 'ad_copy'
    | 'thread';
  brandVoice?: {
    tone?: string;
    audience?: string;
    avoidPhrases?: string[];
    alwaysWords?: string[];
  };
  goal?: string;
  platform?: string;
}

@Injectable()
export class CritiqueService {
  private readonly logger = new Logger(CritiqueService.name);
  private static readonly PASSING_SCORE = 3;
  private static readonly OVERALL_PASS = 3.5;

  constructor(private readonly llm: LlmService) {}

  /**
   * Run a critique pass on artifact content. Returns scores + flags
   * any dimension scoring below 3 as a regression.
   */
  async critique(content: string, context: CritiqueContext): Promise<CritiqueResult> {
    const prompt = this.buildCritiquePrompt(content, context);

    const response = await this.llm.completeJson<{
      scores: CritiqueScore[];
      summary: string;
    }>(prompt, { temperature: 0.3, maxTokens: 1024 });

    const scores = this.normalizeScores(response.scores);
    const overall = scores.reduce((s, x) => s + x.score, 0) / scores.length;
    const failingDimensions = scores
      .filter((s) => s.score < CritiqueService.PASSING_SCORE)
      .map((s) => s.dimension);

    const passed =
      overall >= CritiqueService.OVERALL_PASS && failingDimensions.length === 0;

    return {
      scores,
      overall: Math.round(overall * 10) / 10,
      failingDimensions,
      passed,
      summary: response.summary ?? this.fallbackSummary(scores),
    };
  }

  /**
   * Run critique → if it fails, ask the LLM to revise → critique again.
   * Returns the final passing version (or the best of two attempts).
   *
   * This is the gate you should put in front of any artifact emission.
   */
  async critiqueAndRevise(
    initialContent: string,
    context: CritiqueContext,
    options: { maxAttempts?: number } = {},
  ): Promise<{ finalContent: string; passed: boolean; critique: CritiqueResult; attempts: number }> {
    const maxAttempts = options.maxAttempts ?? 2;
    let content = initialContent;
    let critique = await this.critique(content, context);
    let attempts = 1;

    while (!critique.passed && attempts < maxAttempts) {
      this.logger.log(
        `Critique failed on attempt ${attempts} (score: ${critique.overall}, failing: ${critique.failingDimensions.join(', ')}). Revising...`,
      );

      try {
        const revised = await this.revise(content, context, critique);
        if (revised && revised.length > 20) {
          content = revised;
          critique = await this.critique(content, context);
        }
      } catch (err) {
        this.logger.warn(`Revision attempt ${attempts} failed: ${(err as Error)?.message}`);
        break;
      }

      attempts++;
    }

    return {
      finalContent: content,
      passed: critique.passed,
      critique,
      attempts,
    };
  }

  /**
   * Quick AI-slop check using rule-based detectors. Returns a 0-100 risk score
   * without hitting the LLM. Use as a fast pre-filter before the full critique.
   */
  detectAiSlop(content: string): { riskScore: number; flags: string[] } {
    const flags: string[] = [];
    let score = 0;

    // Em-dashes (the single biggest AI tell)
    const emDashCount = (content.match(/—/g) ?? []).length;
    if (emDashCount > 0) {
      flags.push(`${emDashCount} em-dashes (use commas or periods)`);
      score += emDashCount * 8;
    }

    // Corporate AI buzzwords
    const buzzwordPatterns = [
      /\bAdditionally\b/gi,
      /\bFurthermore\b/gi,
      /\bMoreover\b/gi,
      /\bIn conclusion\b/gi,
      /\bIt('s| is) (worth|important to) (noting|note)\b/gi,
      /\bIn (today's|this) (fast-paced|digital|modern) world\b/gi,
      /\b(leverage|synergy|empower|unlock|elevate|harness|streamline)\b/gi,
      /\bgame-changer\b/gi,
      /\bbest-in-class\b/gi,
      /\bworld-class\b/gi,
      /\bcutting-edge\b/gi,
      /\bnext-gen\b/gi,
      /\brevolutionary\b/gi,
      /\bseamlessly\b/gi,
      /\bdelve into\b/gi,
      /\bnavigating the\b/gi,
      /\bwhether you('re| are) a\b/gi,
    ];

    for (const pattern of buzzwordPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        flags.push(`Buzzword: "${matches[0]}"`);
        score += matches.length * 6;
      }
    }

    // Forced rule-of-three (sentence with exactly three comma-separated items ending with "and")
    const ruleOfThreePattern = /\b\w+,\s+\w+,\s+and\s+\w+/g;
    const ruleOfThreeMatches = content.match(ruleOfThreePattern);
    if (ruleOfThreeMatches && ruleOfThreeMatches.length >= 2) {
      flags.push(`Forced rule-of-three pattern detected ${ruleOfThreeMatches.length}x`);
      score += 4 * ruleOfThreeMatches.length;
    }

    // Generic openers
    const genericOpenerPatterns = [
      /^Are you (tired of|looking for|struggling with)/i,
      /^In the (world|realm) of/i,
      /^Discover the (power|secret) of/i,
      /^Unlock your/i,
    ];

    for (const pattern of genericOpenerPatterns) {
      if (pattern.test(content)) {
        flags.push(`Generic opener: "${content.slice(0, 50)}..."`);
        score += 10;
      }
    }

    // Fake metrics (anything ending in "x faster" / "x more" without real context)
    const fakeMetricPattern = /\b\d+x?\s*(faster|more|better|easier)\b/gi;
    const fakeMetrics = content.match(fakeMetricPattern);
    if (fakeMetrics && fakeMetrics.length > 1) {
      flags.push(`Possible invented metrics: ${fakeMetrics.slice(0, 3).join(', ')}`);
      score += 5;
    }

    // Honest placeholders > fake stats
    // If we see specific-looking numbers without source, flag it
    const suspiciousPercentages = content.match(/\b\d{2,3}%\b/g);
    if (suspiciousPercentages && suspiciousPercentages.length >= 2) {
      flags.push(`${suspiciousPercentages.length} unsourced percentages — verify these are real`);
      score += 3;
    }

    return {
      riskScore: Math.min(100, score),
      flags,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private buildCritiquePrompt(content: string, context: CritiqueContext): string {
    const brandLine = context.brandVoice?.tone
      ? `Brand voice: ${context.brandVoice.tone}.`
      : '';
    const audienceLine = context.brandVoice?.audience
      ? `Audience: ${context.brandVoice.audience}.`
      : '';
    const goalLine = context.goal ? `Goal: ${context.goal}.` : '';
    const platformLine = context.platform ? `Platform: ${context.platform}.` : '';
    const avoidLine = context.brandVoice?.avoidPhrases?.length
      ? `Forbidden phrases: ${context.brandVoice.avoidPhrases.join(', ')}.`
      : '';

    return `You are a senior editorial critic. Score this ${context.artifactType} across 5 dimensions, scale 1-5.

CONTENT:
"""
${content}
"""

CONTEXT:
${[brandLine, audienceLine, goalLine, platformLine, avoidLine].filter(Boolean).join('\n')}

DIMENSIONS (be ruthless — 3 is "barely passable", 5 is "I'd ship this to a paying client"):

1. PHILOSOPHY — Does it match the brand voice? Stay on-pillar? Speak to the actual audience?
   Examples of 1-2: generic, could be any brand, contradicts the brand tone
   Example of 5: unmistakably this brand, perfectly tuned to this audience

2. HIERARCHY — Is the most important thing first? Is the CTA clear? Does the structure pull the eye?
   Examples of 1-2: buries the lead, no clear flow, weak hook
   Example of 5: hook stops scroll, every line earns its place, CTA undeniable

3. DETAIL — Real specifics, concrete examples, honest numbers? Or vague AI fluff?
   Examples of 1-2: "many businesses see results", "a lot of growth"
   Example of 5: specific names, real numbers, named examples, honest placeholders

4. FUNCTION — Does it achieve the stated goal? Will the audience actually act?
   Examples of 1-2: pretty but inert, no clear next step
   Example of 5: drives the exact action the goal requires

5. RESTRAINT — No AI-slop tells? No em-dashes, no "Additionally", no forced rule-of-three?
   Examples of 1-2: corporate buzzwords, em-dashes everywhere, generic openers
   Example of 5: sounds like a thoughtful human wrote it

OUTPUT JSON:
{
  "scores": [
    { "dimension": "philosophy", "score": 1-5, "reasoning": "...", "suggestion": "..." },
    { "dimension": "hierarchy",  "score": 1-5, "reasoning": "...", "suggestion": "..." },
    { "dimension": "detail",     "score": 1-5, "reasoning": "...", "suggestion": "..." },
    { "dimension": "function",   "score": 1-5, "reasoning": "...", "suggestion": "..." },
    { "dimension": "restraint",  "score": 1-5, "reasoning": "...", "suggestion": "..." }
  ],
  "summary": "one-sentence overall verdict"
}`;
  }

  private async revise(
    content: string,
    context: CritiqueContext,
    critique: CritiqueResult,
  ): Promise<string> {
    const failingFeedback = critique.scores
      .filter((s) => s.score < CritiqueService.PASSING_SCORE)
      .map((s) => `${s.dimension.toUpperCase()}: ${s.reasoning}${s.suggestion ? ` Suggestion: ${s.suggestion}` : ''}`)
      .join('\n');

    const prompt = `You are revising a ${context.artifactType} that failed quality review.

ORIGINAL:
"""
${content}
"""

ISSUES TO FIX:
${failingFeedback}

OVERALL: ${critique.summary}

REQUIREMENTS:
- Fix all the issues above
- Keep the core message and length similar
- No em-dashes (use commas or periods)
- No "Additionally", "Furthermore", "Moreover", "In conclusion"
- No forced rule-of-three lists unless they're earned
- Use specific details over vague claims
- If you don't have a real number, write "—" or remove the line

Return ONLY the revised content, no explanation, no preamble.`;

    return this.llm.complete(prompt, { temperature: 0.7, maxTokens: 2048 });
  }

  private normalizeScores(rawScores: CritiqueScore[]): CritiqueScore[] {
    const expectedDims: CritiqueDimension[] = [
      'philosophy',
      'hierarchy',
      'detail',
      'function',
      'restraint',
    ];

    const map = new Map<CritiqueDimension, CritiqueScore>();
    for (const s of rawScores ?? []) {
      if (expectedDims.includes(s.dimension)) {
        const score = Math.max(1, Math.min(5, Math.round(s.score))) as 1 | 2 | 3 | 4 | 5;
        map.set(s.dimension, { ...s, score });
      }
    }

    // Fill any missing dimensions with a neutral 3
    for (const dim of expectedDims) {
      if (!map.has(dim)) {
        map.set(dim, {
          dimension: dim,
          score: 3,
          reasoning: 'Not evaluated, defaulting to neutral',
        });
      }
    }

    return expectedDims.map((dim) => map.get(dim)!);
  }

  private fallbackSummary(scores: CritiqueScore[]): string {
    const failing = scores.filter((s) => s.score < 3);
    if (failing.length === 0) return 'Passes quality review.';
    return `Fails on: ${failing.map((s) => s.dimension).join(', ')}.`;
  }
}
