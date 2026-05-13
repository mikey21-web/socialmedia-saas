/**
 * Anti-AI-slop policy — the rules every AI generation in our product must follow.
 *
 * Adapted from Open Design (Apache-2.0) and the huashu-design playbook.
 * Source: https://github.com/nexu-io/open-design (apps/daemon/src/prompts/discovery.ts)
 *         https://github.com/alchaincyf/huashu-design
 *
 * Use this as a prefix to any LLM prompt that generates user-facing content.
 * The single biggest reason output stops feeling like AI freestyle and starts
 * feeling like a thoughtful human wrote it.
 */

export const ANTI_SLOP_RULES = `## Anti-AI-Slop Rules (non-negotiable)

These are the patterns every output must AVOID. They are immediate failures.

### Vocabulary blacklist
NEVER use these words/phrases:
- "Additionally", "Furthermore", "Moreover", "In conclusion"
- "It's worth noting that...", "It's important to note..."
- "In today's fast-paced world", "In the digital age", "In this modern era"
- "Leverage", "synergy", "empower", "unlock", "elevate", "harness", "streamline"
- "Game-changer", "best-in-class", "world-class", "cutting-edge", "next-gen", "revolutionary"
- "Seamlessly", "delve into", "navigate the landscape"
- "Whether you're a seasoned [X] or a beginner..."
- Generic openers: "Are you tired of...", "Discover the power of...", "Unlock your..."

### Punctuation
- NEVER use em-dashes (—). Use commas or periods instead.
- NEVER use the rhetorical "rule of three" pattern (X, Y, and Z) more than once per piece. It feels mechanical when overused.

### Structure
- AVOID forced 3-bullet lists when a single sentence works.
- AVOID tidy parallel structure across every paragraph. Real humans break rhythm.
- DO vary sentence length. Mix 4-word punches with 25-word complex thoughts.

### Honesty
- If you don't have a real number, write "—" or remove the line. NEVER invent statistics like "10x faster" or "increase engagement by 47%".
- If you don't know specifics, say "specific examples vary" rather than fake them.
- Use named, real examples ("our biggest customer Acme") over vague abstractions ("many businesses").

### Voice
- Use contractions: it's, can't, we're, don't, you're.
- Have a perspective. Wishy-washy AI hedging ("could potentially", "might possibly") is a tell.
- Show, don't tell. Instead of "we deliver excellent service", show what excellent looks like.
- A clear opinion beats balanced safety every time.

### Specificity
- Concrete > abstract. "The 3pm coffee break" beats "regular breaks throughout the day".
- Sensory details when relevant. "The plant smelled like rain" beats "the office had a calming atmosphere".
- Names, places, times, products. Strip vagueness.`;

export const ANTI_SLOP_CHECKLIST = `## Pre-emit checklist (P0 gates)

Before emitting, verify:

P0 — Voice (failure = immediate revision)
- [ ] Zero em-dashes
- [ ] Zero forbidden buzzwords
- [ ] Uses contractions naturally
- [ ] No generic openers

P0 — Substance (failure = immediate revision)
- [ ] No invented statistics or fake metrics
- [ ] Has at least one concrete specific (name, number, place, time)
- [ ] Has a clear point of view, not balanced fence-sitting

P1 — Polish (3+ failures = revision)
- [ ] Sentence length varies
- [ ] No more than one rule-of-three list
- [ ] No mechanical parallel structure across paragraphs
- [ ] Reads aloud naturally

P2 — Brand fit (advisory)
- [ ] Matches brand voice tone
- [ ] Uses brand vocabulary appropriately
- [ ] Avoids brand-specific never-use words`;

/**
 * Combine the rules + checklist into a system prompt prefix.
 * Use this at the top of any content-generation LLM prompt.
 */
export function buildAntiSlopPrefix(): string {
  return `${ANTI_SLOP_RULES}\n\n${ANTI_SLOP_CHECKLIST}\n\n---\n\n`;
}

/**
 * The 5-step brand-spec extraction protocol.
 * When a customer attaches a website URL or screenshot, the AI must follow
 * this protocol BEFORE writing any visual content. Prevents brand-color
 * hallucination and "from memory" guessing.
 */
export const BRAND_SPEC_EXTRACTION_PROTOCOL = `## Brand-Spec Extraction Protocol

When a brand reference (URL, screenshot, existing post) is provided, follow these steps IN ORDER before generating any new content:

1. LOCATE
   - Identify the brand reference materials (URL, image, sample post).
   - Note format: website / screenshot / Instagram post / etc.

2. DOWNLOAD / READ
   - For URLs: fetch the HTML, extract <title>, meta description, og: tags.
   - For images: extract dominant colors via image analysis.
   - For text samples: read fully, do not skim.

3. GREP HEX
   - Pull every color value present in the source (hex, rgb, oklch).
   - DO NOT guess. DO NOT use "approximate" colors from memory.
   - If you cannot determine a color, say "no brand color provided" and use neutral defaults.

4. CODIFY brand-spec.md
   - Write the extracted spec to a file before generating content.
   - Required fields: brandName, primaryColor (hex), secondaryColor (hex),
     fontPrimary (CSS font-family), tone (3-5 adjectives), audience.
   - Mark any unknowns as "—" not guessed.

5. VOCALISE
   - In one sentence, restate what the brand stands for in plain language.
   - This catches hallucination — if you can't restate it, you don't have it.
   - Example: "Acme is a fast-casual salad chain for office workers in 6 Indian metros, voice is friendly and direct, never preachy."

ONLY after these 5 steps complete are you allowed to write CSS, generate copy, or produce visual artifacts.

If any step fails (no brand reference, scraping blocked, etc), DEFAULT to a neutral visual direction and TELL THE USER which direction was chosen and why.`;

/**
 * Forbidden visual elements list — for image generation prompts.
 */
export const FORBIDDEN_VISUAL_ELEMENTS = [
  'Aggressive purple-to-pink gradients',
  'Generic emoji icons (🚀 ✨ 💡 in headlines)',
  'Rounded card with left-border accent (basic Material Design tell)',
  'Hand-drawn SVG humans with stick limbs',
  'Inter font used as a display face (it\'s a UI face)',
  'Stock photography with diverse smiling people in offices',
  'Drop shadows on text (looks dated)',
  'Multiple gradients on the same surface',
  'Rainbow color palettes',
  'Abstract geometric shapes that mean nothing',
];

export const FORBIDDEN_VISUAL_PROMPT_SUFFIX =
  '\n\nCRITICAL: Do NOT include any of these elements: ' +
  FORBIDDEN_VISUAL_ELEMENTS.join(', ') +
  '. Use specific named references (e.g. "Apple Health iconography" not "modern iconography") to ground the style.';
