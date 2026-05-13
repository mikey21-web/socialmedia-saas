/**
 * Discovery Question Form
 *
 * Adapted from Open Design (Apache-2.0) — the "30 seconds of radios beats
 * 30 minutes of redirects" pattern. Before AI generates anything substantial,
 * we capture surface · audience · tone · brand context · scale · constraints
 * via a structured form. Cuts AI freestyle 80% of the time.
 *
 * Source: https://github.com/nexu-io/open-design/blob/main/apps/daemon/src/prompts/discovery.ts
 */

export type DiscoverySurface =
  | 'caption'
  | 'thread'
  | 'carousel'
  | 'reel_script'
  | 'email'
  | 'ad_copy'
  | 'reply';

export type AudienceMode =
  | 'existing_customers'
  | 'new_prospects'
  | 'mixed';

export type Tone =
  | 'authoritative'
  | 'friendly'
  | 'playful'
  | 'urgent'
  | 'inspirational'
  | 'educational'
  | 'contrarian';

export type Scale =
  | 'micro'    // < 100 chars (tweet, caption snippet)
  | 'short'    // 100-300 chars
  | 'medium'   // 300-800 chars
  | 'long';    // > 800 chars

export interface DiscoveryAnswers {
  surface: DiscoverySurface;
  audienceMode: AudienceMode;
  tone: Tone;
  scale: Scale;
  primaryGoal: 'awareness' | 'engagement' | 'leads' | 'sales' | 'community' | 'thought_leadership';
  hardConstraints?: string[];      // ["no mentions of price", "must include CTA", ...]
  inspiration?: string;             // freeform: "like Naval's tweets" / "Patrick Collison's voice"
}

export interface DiscoveryFormField {
  key: keyof DiscoveryAnswers;
  label: string;
  type: 'radio' | 'select' | 'text' | 'multitext';
  required: boolean;
  options?: { value: string; label: string; description?: string }[];
  placeholder?: string;
}

export const DISCOVERY_FORM: DiscoveryFormField[] = [
  {
    key: 'surface',
    label: 'What are you creating?',
    type: 'radio',
    required: true,
    options: [
      { value: 'caption', label: 'Single post caption', description: 'Instagram, X, LinkedIn single' },
      { value: 'thread', label: 'X thread / LinkedIn long-form', description: '5-15 connected posts' },
      { value: 'carousel', label: 'Carousel slides', description: 'Multi-slide deck (Instagram, LinkedIn)' },
      { value: 'reel_script', label: 'Reel / TikTok script', description: '15-60s video script' },
      { value: 'email', label: 'Email broadcast', description: 'Newsletter or campaign email' },
      { value: 'ad_copy', label: 'Paid ad copy', description: 'Variants for testing' },
      { value: 'reply', label: 'Reply to comment / DM', description: 'Engagement response' },
    ],
  },
  {
    key: 'audienceMode',
    label: 'Who is this for?',
    type: 'radio',
    required: true,
    options: [
      { value: 'existing_customers', label: 'Existing customers', description: 'They know us already' },
      { value: 'new_prospects', label: 'New prospects', description: 'First time hearing from us' },
      { value: 'mixed', label: 'Mixed audience', description: 'Both' },
    ],
  },
  {
    key: 'tone',
    label: 'What tone?',
    type: 'radio',
    required: true,
    options: [
      { value: 'authoritative', label: 'Authoritative', description: 'Expert, decisive, taking a stance' },
      { value: 'friendly', label: 'Friendly', description: 'Warm, casual, like talking to a friend' },
      { value: 'playful', label: 'Playful', description: 'Witty, irreverent, fun' },
      { value: 'urgent', label: 'Urgent', description: 'Time-sensitive, action-oriented' },
      { value: 'inspirational', label: 'Inspirational', description: 'Lifting, motivational, vision-led' },
      { value: 'educational', label: 'Educational', description: 'Teaching, explaining, no-fluff' },
      { value: 'contrarian', label: 'Contrarian', description: 'Challenging conventional wisdom' },
    ],
  },
  {
    key: 'scale',
    label: 'How long should it be?',
    type: 'radio',
    required: true,
    options: [
      { value: 'micro', label: 'Micro (< 100 chars)', description: 'Tweet-sized punch' },
      { value: 'short', label: 'Short (100-300 chars)', description: 'Standard caption' },
      { value: 'medium', label: 'Medium (300-800 chars)', description: 'Standard LinkedIn post' },
      { value: 'long', label: 'Long-form (800+ chars)', description: 'Story, breakdown, deep dive' },
    ],
  },
  {
    key: 'primaryGoal',
    label: 'Primary goal?',
    type: 'radio',
    required: true,
    options: [
      { value: 'awareness', label: 'Brand awareness', description: 'Get noticed' },
      { value: 'engagement', label: 'Engagement', description: 'Drive comments/shares' },
      { value: 'leads', label: 'Lead generation', description: 'Capture interest' },
      { value: 'sales', label: 'Direct sales', description: 'Drive purchases' },
      { value: 'community', label: 'Community building', description: 'Strengthen relationships' },
      { value: 'thought_leadership', label: 'Thought leadership', description: 'Establish expertise' },
    ],
  },
  {
    key: 'hardConstraints',
    label: 'Any hard rules? (optional)',
    type: 'multitext',
    required: false,
    placeholder: 'e.g. "no mentions of price", "must include link in bio"',
  },
  {
    key: 'inspiration',
    label: 'Reference style? (optional)',
    type: 'text',
    required: false,
    placeholder: 'e.g. "like Naval\'s tweets", "Mark Manson\'s voice"',
  },
];

/**
 * Smart defaults for filling the form when the user just types a topic.
 * Most users won't fill the full form every time; we infer reasonable
 * defaults from a few signals.
 */
export function inferDefaults(
  partialInput: { topic?: string; platform?: string; intent?: string },
): Partial<DiscoveryAnswers> {
  const defaults: Partial<DiscoveryAnswers> = {
    audienceMode: 'mixed',
    tone: 'friendly',
    scale: 'short',
    primaryGoal: 'engagement',
  };

  // Platform hints
  if (partialInput.platform) {
    const p = partialInput.platform.toLowerCase();
    if (p === 'twitter' || p === 'x') {
      defaults.surface = 'caption';
      defaults.scale = 'micro';
    } else if (p === 'linkedin') {
      defaults.surface = 'caption';
      defaults.scale = 'medium';
      defaults.tone = 'authoritative';
    } else if (p === 'instagram') {
      defaults.surface = 'caption';
      defaults.scale = 'short';
    } else if (p === 'tiktok' || p === 'youtube') {
      defaults.surface = 'reel_script';
      defaults.scale = 'short';
      defaults.tone = 'playful';
    }
  }

  // Topic hints
  if (partialInput.topic) {
    const t = partialInput.topic.toLowerCase();
    if (/\b(how to|tutorial|guide|step)\b/.test(t)) {
      defaults.tone = 'educational';
      defaults.primaryGoal = 'thought_leadership';
    } else if (/\b(launch|release|announce)\b/.test(t)) {
      defaults.tone = 'urgent';
      defaults.primaryGoal = 'awareness';
    } else if (/\b(sale|discount|offer|deal)\b/.test(t)) {
      defaults.tone = 'urgent';
      defaults.primaryGoal = 'sales';
    } else if (/\b(case study|customer|story)\b/.test(t)) {
      defaults.tone = 'authoritative';
      defaults.primaryGoal = 'leads';
    }
  }

  return defaults;
}

/**
 * Render discovery answers into a prompt fragment that the LLM can use.
 * Inject this above the actual content brief.
 */
export function answersToPromptContext(answers: DiscoveryAnswers): string {
  const lines = [
    `Surface: ${answers.surface}`,
    `Audience: ${answers.audienceMode.replace(/_/g, ' ')}`,
    `Tone: ${answers.tone}`,
    `Length: ${answers.scale}`,
    `Goal: ${answers.primaryGoal.replace(/_/g, ' ')}`,
  ];

  if (answers.hardConstraints?.length) {
    lines.push(`Hard rules:\n${answers.hardConstraints.map((c) => `  - ${c}`).join('\n')}`);
  }

  if (answers.inspiration) {
    lines.push(`Reference style: ${answers.inspiration}`);
  }

  return `## Brief\n${lines.join('\n')}`;
}
