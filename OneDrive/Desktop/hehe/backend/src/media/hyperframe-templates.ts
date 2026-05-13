/**
 * HyperFrames template catalog.
 *
 * 4 original templates (quote-card, announcement, stat-card, product-showcase)
 * + 11 archetype templates ported from Open Design (Apache-2.0).
 * Source: https://github.com/nexu-io/open-design/tree/main/prompt-templates/video
 *
 * Each template is HTML+CSS that renders to MP4 via Puppeteer + FFmpeg.
 */

export interface HyperframeTemplateMeta {
  id: string;
  name: string;
  category: 'product' | 'social' | 'data' | 'brand' | 'utility' | 'lifestyle';
  description: string;
  durationSec: number;
  recommendedFormat: 'story' | 'square' | 'landscape';
  fields: HyperframeFieldDef[];
  attribution?: string;
}

export interface HyperframeFieldDef {
  key: string;
  label: string;
  type: 'text' | 'longtext' | 'color' | 'number' | 'image_url';
  required?: boolean;
  placeholder?: string;
  default?: string | number;
}

export const HYPERFRAME_TEMPLATES: HyperframeTemplateMeta[] = [
  // ─── Original 4 templates ──────────────────────────────────────────────────
  {
    id: 'quote-card',
    name: 'Quote Card',
    category: 'social',
    description: 'Pull-quote with author attribution, fade-in animation',
    durationSec: 3,
    recommendedFormat: 'story',
    fields: [
      { key: 'quote', label: 'Quote', type: 'longtext', required: true, placeholder: 'The best time to plant a tree was 20 years ago. The second best time is now.' },
      { key: 'author', label: 'Author', type: 'text', required: true, placeholder: 'Chinese Proverb' },
      { key: 'bgColor', label: 'Background', type: 'color', default: '#0f172a' },
      { key: 'accentColor', label: 'Accent', type: 'color', default: '#6366f1' },
    ],
  },
  {
    id: 'announcement',
    name: 'Announcement',
    category: 'brand',
    description: 'Big headline with badge and subtext, gradient background',
    durationSec: 3,
    recommendedFormat: 'story',
    fields: [
      { key: 'headline', label: 'Headline', type: 'text', required: true, placeholder: 'Now Available' },
      { key: 'subtext', label: 'Subtext', type: 'longtext', placeholder: 'After 6 months in beta...' },
      { key: 'badge', label: 'Badge', type: 'text', placeholder: 'NEW' },
      { key: 'bgColor', label: 'Background', type: 'color', default: '#0f172a' },
      { key: 'accentColor', label: 'Accent', type: 'color', default: '#6366f1' },
    ],
  },
  {
    id: 'stat-card',
    name: 'Stat Card',
    category: 'data',
    description: 'Big number with label and context, count-up animation',
    durationSec: 3,
    recommendedFormat: 'story',
    fields: [
      { key: 'metric', label: 'Big Number', type: 'text', required: true, placeholder: '200%' },
      { key: 'label', label: 'Label', type: 'text', required: true, placeholder: 'Revenue Growth' },
      { key: 'context', label: 'Context', type: 'text', placeholder: 'in 6 months' },
      { key: 'bgColor', label: 'Background', type: 'color', default: '#0f172a' },
      { key: 'accentColor', label: 'Accent', type: 'color', default: '#6366f1' },
    ],
  },
  {
    id: 'product-showcase',
    name: 'Product Showcase',
    category: 'product',
    description: 'Product name + tagline + CTA, gradient with brand colors',
    durationSec: 3,
    recommendedFormat: 'story',
    fields: [
      { key: 'productName', label: 'Product Name', type: 'text', required: true },
      { key: 'tagline', label: 'Tagline', type: 'text', required: true },
      { key: 'cta', label: 'CTA Text', type: 'text', placeholder: 'Get it now' },
      { key: 'bgColor', label: 'Background', type: 'color', default: '#0f172a' },
      { key: 'accentColor', label: 'Accent', type: 'color', default: '#6366f1' },
    ],
  },

  // ─── 11 archetypes ported from Open Design ─────────────────────────────────

  {
    id: 'product-reveal-minimal',
    name: '5s Minimal Product Reveal',
    category: 'product',
    description: 'Push-in title card with shader transition. Apple-style minimalism.',
    durationSec: 5,
    recommendedFormat: 'landscape',
    attribution: 'Adapted from Open Design (Apache-2.0)',
    fields: [
      { key: 'productName', label: 'Product Name', type: 'text', required: true },
      { key: 'tagline', label: 'One-line Tagline', type: 'text', required: true },
      { key: 'bgColor', label: 'Background', type: 'color', default: '#000000' },
      { key: 'accentColor', label: 'Accent', type: 'color', default: '#ffffff' },
    ],
  },
  {
    id: 'saas-promo-30s',
    name: '30s SaaS Product Promo',
    category: 'product',
    description: 'Linear/ClickUp-style with UI 3D reveals. For SaaS launches.',
    durationSec: 30,
    recommendedFormat: 'landscape',
    attribution: 'Adapted from Open Design (Apache-2.0)',
    fields: [
      { key: 'productName', label: 'Product', type: 'text', required: true },
      { key: 'problemHook', label: 'Problem hook', type: 'longtext', required: true, placeholder: 'Tired of switching between 8 tools?' },
      { key: 'feature1', label: 'Feature 1', type: 'text', required: true },
      { key: 'feature2', label: 'Feature 2', type: 'text', required: true },
      { key: 'feature3', label: 'Feature 3', type: 'text', required: true },
      { key: 'cta', label: 'CTA', type: 'text', default: 'Get started free' },
      { key: 'accentColor', label: 'Brand color', type: 'color', default: '#6366f1' },
    ],
  },
  {
    id: 'tiktok-karaoke',
    name: 'TikTok Karaoke Talking-Head',
    category: 'social',
    description: 'TTS + word-synced captions. Vertical 9:16 for Reels/TikTok/Shorts.',
    durationSec: 30,
    recommendedFormat: 'story',
    attribution: 'Adapted from Open Design (Apache-2.0)',
    fields: [
      { key: 'script', label: 'Script (will be TTS narrated)', type: 'longtext', required: true },
      { key: 'speakerImageUrl', label: 'Speaker photo URL', type: 'image_url' },
      { key: 'captionStyle', label: 'Caption style', type: 'text', default: 'bold-yellow', placeholder: 'bold-yellow, modern-white, neon-pink' },
      { key: 'bgColor', label: 'Background', type: 'color', default: '#0f172a' },
    ],
  },
  {
    id: 'brand-sizzle-reel',
    name: '30s Brand Sizzle Reel',
    category: 'brand',
    description: 'Beat-synced kinetic typography, audio-reactive. For brand launches.',
    durationSec: 30,
    recommendedFormat: 'landscape',
    attribution: 'Adapted from Open Design (Apache-2.0)',
    fields: [
      { key: 'brandName', label: 'Brand Name', type: 'text', required: true },
      { key: 'word1', label: 'Word 1 (1-2 syllables)', type: 'text', required: true, placeholder: 'BUILD' },
      { key: 'word2', label: 'Word 2', type: 'text', required: true, placeholder: 'SHIP' },
      { key: 'word3', label: 'Word 3', type: 'text', required: true, placeholder: 'GROW' },
      { key: 'tagline', label: 'Closing tagline', type: 'text', required: true },
      { key: 'accentColor', label: 'Brand color', type: 'color', default: '#ff5500' },
      { key: 'bgColor', label: 'Background', type: 'color', default: '#000000' },
    ],
  },
  {
    id: 'data-bar-chart-race',
    name: 'Animated Bar Chart Race',
    category: 'data',
    description: 'NYT-style data infographic with animated bars. For stats posts.',
    durationSec: 8,
    recommendedFormat: 'landscape',
    attribution: 'Adapted from Open Design (Apache-2.0)',
    fields: [
      { key: 'title', label: 'Chart Title', type: 'text', required: true },
      { key: 'item1Label', label: 'Item 1 label', type: 'text', required: true },
      { key: 'item1Value', label: 'Item 1 value', type: 'number', required: true },
      { key: 'item2Label', label: 'Item 2 label', type: 'text', required: true },
      { key: 'item2Value', label: 'Item 2 value', type: 'number', required: true },
      { key: 'item3Label', label: 'Item 3 label', type: 'text', required: true },
      { key: 'item3Value', label: 'Item 3 value', type: 'number', required: true },
      { key: 'item4Label', label: 'Item 4 label', type: 'text' },
      { key: 'item4Value', label: 'Item 4 value', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'text', default: '%' },
      { key: 'accentColor', label: 'Bar color', type: 'color', default: '#6366f1' },
    ],
  },
  {
    id: 'flight-map-route',
    name: 'Flight Map Route Reveal',
    category: 'utility',
    description: 'Apple-style cinematic origin → destination route reveal',
    durationSec: 6,
    recommendedFormat: 'landscape',
    attribution: 'Adapted from Open Design (Apache-2.0)',
    fields: [
      { key: 'origin', label: 'Origin city', type: 'text', required: true, placeholder: 'New York' },
      { key: 'destination', label: 'Destination city', type: 'text', required: true, placeholder: 'Tokyo' },
      { key: 'distanceLabel', label: 'Distance / Duration', type: 'text', placeholder: '6,740 mi · 14h flight' },
      { key: 'accentColor', label: 'Route color', type: 'color', default: '#ef4444' },
    ],
  },
  {
    id: 'logo-outro-cinematic',
    name: '4s Cinematic Logo Outro',
    category: 'brand',
    description: 'Piece-by-piece logo assembly with bloom effect. For video endings.',
    durationSec: 4,
    recommendedFormat: 'landscape',
    attribution: 'Adapted from Open Design (Apache-2.0)',
    fields: [
      { key: 'logoText', label: 'Brand text (or initials)', type: 'text', required: true },
      { key: 'tagline', label: 'Tagline', type: 'text' },
      { key: 'bgColor', label: 'Background', type: 'color', default: '#000000' },
      { key: 'accentColor', label: 'Logo color', type: 'color', default: '#ffffff' },
    ],
  },
  {
    id: 'money-counter-hype',
    name: '$0 → $10K Money Counter',
    category: 'data',
    description: 'Apple-style hype with green flash + burst. For revenue/savings claims.',
    durationSec: 5,
    recommendedFormat: 'story',
    attribution: 'Adapted from Open Design (Apache-2.0)',
    fields: [
      { key: 'startValue', label: 'Start value', type: 'number', default: 0 },
      { key: 'endValue', label: 'End value', type: 'number', required: true, default: 10000 },
      { key: 'currencySymbol', label: 'Currency symbol', type: 'text', default: '₹' },
      { key: 'label', label: 'Label below', type: 'text', required: true, placeholder: 'Revenue this quarter' },
      { key: 'accentColor', label: 'Counter color', type: 'color', default: '#22c55e' },
      { key: 'bgColor', label: 'Background', type: 'color', default: '#000000' },
    ],
  },
  {
    id: 'app-showcase-three-phones',
    name: '3-Phone App Showcase',
    category: 'product',
    description: 'Floating phones with feature callouts. For mobile app launches.',
    durationSec: 8,
    recommendedFormat: 'landscape',
    attribution: 'Adapted from Open Design (Apache-2.0)',
    fields: [
      { key: 'appName', label: 'App Name', type: 'text', required: true },
      { key: 'screen1Url', label: 'Screen 1 image URL', type: 'image_url', required: true },
      { key: 'screen1Feature', label: 'Screen 1 feature label', type: 'text', required: true },
      { key: 'screen2Url', label: 'Screen 2 image URL', type: 'image_url', required: true },
      { key: 'screen2Feature', label: 'Screen 2 feature label', type: 'text', required: true },
      { key: 'screen3Url', label: 'Screen 3 image URL', type: 'image_url', required: true },
      { key: 'screen3Feature', label: 'Screen 3 feature label', type: 'text', required: true },
      { key: 'bgColor', label: 'Background', type: 'color', default: '#0f172a' },
      { key: 'accentColor', label: 'Accent', type: 'color', default: '#6366f1' },
    ],
  },
  {
    id: 'social-overlay-stack',
    name: 'Social Overlay Stack',
    category: 'social',
    description: 'X · Reddit · Spotify · Instagram-style cards in sequence. For social proof.',
    durationSec: 10,
    recommendedFormat: 'story',
    attribution: 'Adapted from Open Design (Apache-2.0)',
    fields: [
      { key: 'card1Type', label: 'Card 1 (twitter|reddit|spotify|instagram)', type: 'text', default: 'twitter' },
      { key: 'card1Author', label: 'Card 1 author/handle', type: 'text', required: true },
      { key: 'card1Content', label: 'Card 1 content', type: 'longtext', required: true },
      { key: 'card2Type', label: 'Card 2 type', type: 'text', default: 'reddit' },
      { key: 'card2Author', label: 'Card 2 author', type: 'text' },
      { key: 'card2Content', label: 'Card 2 content', type: 'longtext' },
      { key: 'card3Type', label: 'Card 3 type', type: 'text', default: 'instagram' },
      { key: 'card3Author', label: 'Card 3 author', type: 'text' },
      { key: 'card3Content', label: 'Card 3 content', type: 'longtext' },
      { key: 'bgColor', label: 'Background', type: 'color', default: '#0a0a0a' },
    ],
  },
  {
    id: 'website-to-video',
    name: 'Website-to-Video Promo',
    category: 'product',
    description: 'Captures site at 3 viewports + transitions. For website launches.',
    durationSec: 12,
    recommendedFormat: 'landscape',
    attribution: 'Adapted from Open Design (Apache-2.0)',
    fields: [
      { key: 'websiteUrl', label: 'Website URL', type: 'image_url', required: true },
      { key: 'productName', label: 'Product Name', type: 'text', required: true },
      { key: 'tagline', label: 'Tagline', type: 'text', required: true },
      { key: 'cta', label: 'CTA', type: 'text', default: 'Visit now' },
      { key: 'accentColor', label: 'Accent', type: 'color', default: '#6366f1' },
    ],
  },
];

export function getTemplateById(id: string): HyperframeTemplateMeta | undefined {
  return HYPERFRAME_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: HyperframeTemplateMeta['category']): HyperframeTemplateMeta[] {
  return HYPERFRAME_TEMPLATES.filter((t) => t.category === category);
}
