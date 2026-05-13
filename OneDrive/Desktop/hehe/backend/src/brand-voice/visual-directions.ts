/**
 * Visual Directions library — 5 deterministic design schools.
 *
 * Adapted from Open Design (Apache-2.0) and the huashu-design "5 schools × 20
 * design philosophies" library. Used during onboarding when a customer doesn't
 * have brand guidelines yet — they pick one direction and we lock the palette,
 * font stack, and tone in 30 seconds instead of having the AI freestyle.
 *
 * Source: https://github.com/nexu-io/open-design (apps/daemon/src/prompts/directions.ts)
 *         https://github.com/alchaincyf/huashu-design
 */

export type DirectionId =
  | 'editorial-monocle'
  | 'modern-minimal'
  | 'tech-utility'
  | 'brutalist-experimental'
  | 'soft-warm';

export interface VisualDirection {
  id: DirectionId;
  name: string;
  tagline: string;
  description: string;
  references: string[];
  mood: string[];
  colors: {
    /** OKLch palette as CSS-compatible hex equivalents */
    primary: string;
    secondary: string;
    accent: string;
    light: string;
    dark: string;
    background: string;
    foreground: string;
    muted: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    mono?: string;
  };
  layoutPosture: string[];
  toneDimensions: {
    formality: number;        // 0-1
    playfulness: number;
    urgency: number;
    warmth: number;
    technicality: number;
    authority: number;
    vulnerability: number;
    humor: number;
    directness: number;
    inspiration: number;
  };
  emojiUsage: 'frequent' | 'moderate' | 'minimal' | 'none';
  hashtagStyle: 'lowercase' | 'camelCase' | 'TitleCase';
}

export const VISUAL_DIRECTIONS: VisualDirection[] = [
  {
    id: 'editorial-monocle',
    name: 'Editorial — Monocle / FT',
    tagline: 'Print magazine ink + cream + warm rust',
    description: 'Confident, considered, the tone of a senior editor. Headlines do most of the work, body copy is dense but readable, photography is documentary not commercial. Avoid sans-serif headlines, avoid neon, avoid AI illustrations.',
    references: ['Monocle', 'FT Weekend', 'NYT Magazine', 'Apartamento', 'Cereal'],
    mood: ['considered', 'confident', 'observational', 'understated', 'crafted'],
    colors: {
      primary: '#1a1a1a',
      secondary: '#8b6f47',
      accent: '#c4622d',
      light: '#f5f1e8',
      dark: '#0f0f0f',
      background: '#faf7f0',
      foreground: '#1a1a1a',
      muted: '#a89c84',
    },
    fonts: {
      primary: '"Playfair Display", "Georgia", serif',
      secondary: '"Inter", system-ui, sans-serif',
      mono: '"IBM Plex Mono", monospace',
    },
    layoutPosture: [
      'Wide margins, generous leading',
      'Drop caps on opening paragraphs',
      'Single-column body, never card-based',
      'Numerals as design elements (issue 12, vol 4)',
      'Photography over illustration',
    ],
    toneDimensions: {
      formality: 0.75,
      playfulness: 0.25,
      urgency: 0.2,
      warmth: 0.6,
      technicality: 0.4,
      authority: 0.85,
      vulnerability: 0.3,
      humor: 0.3,
      directness: 0.65,
      inspiration: 0.55,
    },
    emojiUsage: 'minimal',
    hashtagStyle: 'TitleCase',
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal — Linear / Vercel',
    tagline: 'Cool, structured, minimal accent',
    description: 'Tech-product clean. Tight type, lots of negative space, one accent color used surgically. Reads like a thoughtfully built tool. Avoid drop shadows, avoid gradients except for hero, avoid playful fonts.',
    references: ['Linear', 'Vercel', 'Stripe', 'Raycast', 'Notion'],
    mood: ['precise', 'considered', 'modern', 'restrained', 'professional'],
    colors: {
      primary: '#0a0a0a',
      secondary: '#525252',
      accent: '#5e6ad2',
      light: '#fafafa',
      dark: '#000000',
      background: '#ffffff',
      foreground: '#0a0a0a',
      muted: '#737373',
    },
    fonts: {
      primary: '"Inter", system-ui, sans-serif',
      secondary: '"Inter", system-ui, sans-serif',
      mono: '"JetBrains Mono", monospace',
    },
    layoutPosture: [
      'Lots of whitespace around content',
      '12-column grid, clean boundaries',
      'Type hierarchy via weight/size, never color',
      'One accent color, used 1-2 times max per surface',
      'Clean lines, no decorative elements',
    ],
    toneDimensions: {
      formality: 0.6,
      playfulness: 0.3,
      urgency: 0.3,
      warmth: 0.4,
      technicality: 0.7,
      authority: 0.8,
      vulnerability: 0.2,
      humor: 0.25,
      directness: 0.85,
      inspiration: 0.45,
    },
    emojiUsage: 'minimal',
    hashtagStyle: 'lowercase',
  },
  {
    id: 'tech-utility',
    name: 'Tech Utility — Bloomberg / Bauhaus',
    tagline: 'Information density, monospace, terminal aesthetic',
    description: 'Bloomberg terminal meets developer tool. Information is the design. Fixed-width fonts, dense data tables, ASCII separators. Aimed at users who want to feel like power users.',
    references: ['Bloomberg Terminal', 'Hacker News', 'Bauhaus design tools', 'Vercel CLI', 'Warp Terminal'],
    mood: ['dense', 'utilitarian', 'powerful', 'no-nonsense', 'systems-thinking'],
    colors: {
      primary: '#ff7a00',
      secondary: '#00ff95',
      accent: '#ff7a00',
      light: '#1a1a1a',
      dark: '#000000',
      background: '#0a0a0a',
      foreground: '#e5e5e5',
      muted: '#666666',
    },
    fonts: {
      primary: '"JetBrains Mono", "IBM Plex Mono", monospace',
      secondary: '"Inter", system-ui, sans-serif',
      mono: '"JetBrains Mono", monospace',
    },
    layoutPosture: [
      'Fixed-width grid, dense data layouts',
      'Hard separators using ─ ═ │ characters',
      'Status indicators with colored dots',
      'Numbers right-aligned, units inline',
      'No rounded corners — sharp edges only',
    ],
    toneDimensions: {
      formality: 0.5,
      playfulness: 0.4,
      urgency: 0.6,
      warmth: 0.2,
      technicality: 0.95,
      authority: 0.85,
      vulnerability: 0.15,
      humor: 0.4,
      directness: 0.95,
      inspiration: 0.35,
    },
    emojiUsage: 'none',
    hashtagStyle: 'lowercase',
  },
  {
    id: 'brutalist-experimental',
    name: 'Brutalist Experimental — Bloomberg Businessweek',
    tagline: 'Raw, oversized type, no shadows, harsh accents',
    description: 'For brands that want to look fearless. Massive type that breaks the grid. Two contrasting colors used aggressively. Reads like a cultural manifesto.',
    references: ['Bloomberg Businessweek', 'Achtung magazine', 'Are.na', 'Cabinet Magazine', 'Wallpaper'],
    mood: ['bold', 'fearless', 'opinionated', 'provocative', 'crafted-rough'],
    colors: {
      primary: '#000000',
      secondary: '#ff3838',
      accent: '#ffea00',
      light: '#ffffff',
      dark: '#000000',
      background: '#ffffff',
      foreground: '#000000',
      muted: '#7a7a7a',
    },
    fonts: {
      primary: '"Archivo Black", "Helvetica", sans-serif',
      secondary: '"Times New Roman", serif',
      mono: '"Courier", monospace',
    },
    layoutPosture: [
      'Headlines that break out of the grid',
      'Type set in sizes 200px+ on hero surfaces',
      'Two colors used aggressively (one bold + one neon)',
      'Hard outlines, no rounded corners',
      'Asymmetric layouts, intentional imbalance',
    ],
    toneDimensions: {
      formality: 0.4,
      playfulness: 0.55,
      urgency: 0.7,
      warmth: 0.3,
      technicality: 0.5,
      authority: 0.8,
      vulnerability: 0.4,
      humor: 0.55,
      directness: 0.95,
      inspiration: 0.65,
    },
    emojiUsage: 'minimal',
    hashtagStyle: 'lowercase',
  },
  {
    id: 'soft-warm',
    name: 'Soft Warm — Notion / Apple Health',
    tagline: 'Generous, low contrast, peachy neutrals',
    description: 'Approachable, warm, optimistic. The brand a friend would recommend. Rounded corners, gentle gradients, peachy/dusty rose neutrals. Avoid harsh contrasts, avoid corporate stock photography.',
    references: ['Notion marketing', 'Apple Health', 'Headspace', 'Mailchimp', 'Slack onboarding'],
    mood: ['approachable', 'warm', 'optimistic', 'human', 'gentle'],
    colors: {
      primary: '#2d2a26',
      secondary: '#c89b7b',
      accent: '#ff9b85',
      light: '#fef6f0',
      dark: '#2d2a26',
      background: '#fef6f0',
      foreground: '#2d2a26',
      muted: '#a08977',
    },
    fonts: {
      primary: '"Söhne", "Inter", system-ui, sans-serif',
      secondary: '"Tiempos Text", "Georgia", serif',
      mono: '"JetBrains Mono", monospace',
    },
    layoutPosture: [
      'Rounded corners (16px+)',
      'Gentle drop shadows for depth',
      'Generous whitespace, never cramped',
      'Hand-drawn-feel illustrations over photos',
      'Pastel accent colors, never neon',
    ],
    toneDimensions: {
      formality: 0.35,
      playfulness: 0.7,
      urgency: 0.2,
      warmth: 0.95,
      technicality: 0.3,
      authority: 0.5,
      vulnerability: 0.7,
      humor: 0.6,
      directness: 0.55,
      inspiration: 0.75,
    },
    emojiUsage: 'frequent',
    hashtagStyle: 'TitleCase',
  },
];

export function getDirectionById(id: DirectionId): VisualDirection | undefined {
  return VISUAL_DIRECTIONS.find((d) => d.id === id);
}

/**
 * Convert a visual direction into a partial BrandVoiceProfile shape that
 * matches the existing Prisma model. Lets us seed a brand voice profile
 * from a one-click direction pick during onboarding.
 */
export function directionToBrandVoiceProfile(direction: VisualDirection) {
  return {
    name: direction.name,
    primaryColor: direction.colors.accent,
    brandLight: direction.colors.light,
    brandDark: direction.colors.dark,
    lightBg: direction.colors.background,
    lightBorder: direction.colors.muted,
    darkBg: direction.colors.dark,
    fontPrimary: direction.fonts.primary,
    fontSecondary: direction.fonts.secondary ?? null,
    toneDimensions: direction.toneDimensions,
    vocabularyBank: {
      commonWords: [],
      avoidWords: [],
      industryTerms: [],
    },
    emojiPatterns: {
      frequency: direction.emojiUsage === 'frequent' ? 0.8
        : direction.emojiUsage === 'moderate' ? 0.5
        : direction.emojiUsage === 'minimal' ? 0.2
        : 0,
      preferred: [],
      avoidEmojis: [],
    },
    sentencePatterns: {
      avgLength: 14,
      variation: 0.6,
      preferLists: false,
    },
    hashtagStyle: {
      placement: 'end',
      count: 6,
      format: direction.hashtagStyle,
    },
  };
}
