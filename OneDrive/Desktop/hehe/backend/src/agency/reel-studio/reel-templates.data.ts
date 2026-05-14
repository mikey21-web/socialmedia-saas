/**
 * Reel Studio Template Library
 *
 * Curated, research-backed Reel templates for Indian SMBs.
 * Each template encodes:
 *  - Hook in first 1.5s, pattern interrupt at 3s, CTA in last 2s
 *  - Shot list with camera angles, lighting tips, props
 *  - Caption + hashtag templates per vertical
 *  - Audio mood preferences
 *
 * Engagement tier is based on observed engagement rate by format
 * (high = ≥ vertical avg, medium = within 50%, low = experimental).
 *
 * Source: Internal analysis of Indian Instagram reach data 2025-2026
 * + Meta's Creator Insights public benchmarks.
 */

export interface ReelShot {
  index: number;
  durationSec: number;
  action: string;
  cameraAngle: string;
  lightingTip: string;
  propsNeeded: string[];
  textOverlay: string;
  voiceoverHint?: string;
}

export interface ReelStructure {
  hookSec: number;
  patternInterruptSec?: number;
  ctaSec: number;
  beats: string[];
}

export interface HashtagSet {
  niche: string;
  tags: string[];
}

export interface ReelTemplateData {
  slug: string;
  title: string;
  category:
    | 'product_showcase'
    | 'bts'
    | 'educational'
    | 'before_after'
    | 'founder_story'
    | 'testimonial'
    | 'trend_riding'
    | 'day_in_life'
    | 'promo'
    | 'comparison'
    | 'tutorial'
    | 'story';
  vertical: string;
  goal: 'awareness' | 'conversion' | 'engagement' | 'trust' | 'educate' | 'entertain';
  difficulty: 'easy' | 'medium' | 'advanced';
  estDurationSec: number;
  shotCount: number;
  shotList: ReelShot[];
  structure: ReelStructure;
  captionTemplate: string;
  hashtagSets: HashtagSet[];
  audioMood: string[];
  engagementTier: 'high' | 'medium' | 'low';
  language: string;
  tags: string[];
}

const baseHashtags = {
  india: ['#india', '#indianbusiness', '#smallbusinessindia'],
  reels: ['#reels', '#reelsindia', '#reelitfeelit', '#explorepage'],
};

/* ───────────────────────── SALON / BEAUTY / SKINCARE ─────────────────────── */

const salonTemplates: ReelTemplateData[] = [
  {
    slug: 'salon-before-after-3shot',
    title: 'Before / After Transformation (3-shot)',
    category: 'before_after',
    vertical: 'salon',
    goal: 'engagement',
    difficulty: 'easy',
    estDurationSec: 15,
    shotCount: 3,
    structure: {
      hookSec: 1.5,
      patternInterruptSec: 5,
      ctaSec: 13,
      beats: ['Show problem', 'Show transformation', 'Reveal final', 'CTA'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'Client looking unsure / before state',
        cameraAngle: 'Eye-level close-up on face/hair',
        lightingTip: 'Soft window light from front, no harsh shadows',
        propsNeeded: ['Salon chair', 'Mirror'],
        textOverlay: 'POV: walked in like this',
        voiceoverHint: 'Optional reaction sound',
      },
      {
        index: 2,
        durationSec: 8,
        action: 'Quick cuts of the styling process: scissors, dye brush, dryer',
        cameraAngle: 'Mix of overhead and 45° side angles',
        lightingTip: 'Use ring light if salon is dim',
        propsNeeded: ['Tools you actually used'],
        textOverlay: '⚡ Quick magic',
      },
      {
        index: 3,
        durationSec: 5,
        action: 'Big reveal — client smile, hair toss, mirror moment',
        cameraAngle: 'Eye-level, slightly low angle',
        lightingTip: 'Soft front light + a small back light if possible',
        propsNeeded: [],
        textOverlay: 'walked out like THIS ✨',
      },
    ],
    captionTemplate:
      '{{clientFirstName}} came in looking for {{request}}. Here\'s what we did. ✨\n\nDM "{{keyword}}" to book your slot — 3 spots open this week.',
    hashtagSets: [
      {
        niche: 'salon',
        tags: [
          '#salon',
          '#hairtransformation',
          '#beforeafter',
          '#salonindia',
          '#hairgoals',
          '#hairsalon',
          '#hairstylist',
          '#hairmakeover',
          '#hairtreatment',
          ...baseHashtags.reels,
        ],
      },
    ],
    audioMood: ['upbeat', 'transformation', 'satisfying'],
    engagementTier: 'high',
    language: 'en',
    tags: ['transformation', 'reveal', 'high-engagement'],
  },
  {
    slug: 'salon-day-in-life-stylist',
    title: 'Day in the Life of a Stylist',
    category: 'day_in_life',
    vertical: 'salon',
    goal: 'trust',
    difficulty: 'easy',
    estDurationSec: 30,
    shotCount: 5,
    structure: {
      hookSec: 1.5,
      patternInterruptSec: 8,
      ctaSec: 27,
      beats: ['Hook with energy', 'Morning prep', 'Client transformation', 'Lunch / break', 'End of day vibe'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'Walk into salon, lights on, ready face',
        cameraAngle: 'Phone at eye level, walking',
        lightingTip: 'Natural morning light',
        propsNeeded: ['Apron'],
        textOverlay: '8 AM ✨ another day, another transformation',
      },
      {
        index: 2,
        durationSec: 5,
        action: 'Setting up tools — closeup of scissors, combs, products',
        cameraAngle: 'Overhead flat lay + closeups',
        lightingTip: 'Bright, even',
        propsNeeded: ['Salon tools'],
        textOverlay: 'mise en place 💇',
      },
      {
        index: 3,
        durationSec: 12,
        action: 'Real client transformation — quick cuts',
        cameraAngle: 'Mix of angles, focus on hands & face',
        lightingTip: 'Ring light if dim',
        propsNeeded: ['Client'],
        textOverlay: 'today\'s star ⭐',
      },
      {
        index: 4,
        durationSec: 6,
        action: 'Quick lunch / chai moment with team',
        cameraAngle: 'Handheld, candid',
        lightingTip: 'Whatever\'s natural',
        propsNeeded: ['Chai / lunch'],
        textOverlay: 'fuel break ☕',
      },
      {
        index: 5,
        durationSec: 5,
        action: 'End of day — clean station, lights off, walking out',
        cameraAngle: 'Eye level, walking out',
        lightingTip: 'Soft evening light if possible',
        propsNeeded: [],
        textOverlay: 'see you tomorrow 💕',
      },
    ],
    captionTemplate:
      'Behind every great hair day is a stylist who loves what they do.\n\nBook with us: {{bookingLink}}',
    hashtagSets: [
      {
        niche: 'salon',
        tags: [
          '#dayinthelife',
          '#hairstylist',
          '#salonlife',
          '#salonindia',
          '#smallbusinesslife',
          '#stylistlife',
          ...baseHashtags.reels,
          ...baseHashtags.india,
        ],
      },
    ],
    audioMood: ['aesthetic', 'calm', 'trending'],
    engagementTier: 'high',
    language: 'en',
    tags: ['behind-the-scenes', 'authentic'],
  },
  {
    slug: 'salon-3-tips-rapid',
    title: '3 Tips Rapid-Fire (haircare)',
    category: 'educational',
    vertical: 'salon',
    goal: 'educate',
    difficulty: 'easy',
    estDurationSec: 20,
    shotCount: 4,
    structure: {
      hookSec: 1.5,
      patternInterruptSec: 5,
      ctaSec: 18,
      beats: ['Hook claim', 'Tip 1', 'Tip 2', 'Tip 3', 'CTA'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'Speak directly to camera, point/gesture',
        cameraAngle: 'Selfie or eye-level',
        lightingTip: 'Front light, soft',
        propsNeeded: [],
        textOverlay: '3 things ruining your hair (and you don\'t know it)',
        voiceoverHint: 'Energetic, conversational opener',
      },
      {
        index: 2,
        durationSec: 5,
        action: 'Tip 1 demo — visual example',
        cameraAngle: 'Closeup on demo',
        lightingTip: 'Bright',
        propsNeeded: ['Tip 1 prop'],
        textOverlay: '1️⃣ {{tip1}}',
      },
      {
        index: 3,
        durationSec: 5,
        action: 'Tip 2 demo',
        cameraAngle: 'Closeup',
        lightingTip: 'Bright',
        propsNeeded: ['Tip 2 prop'],
        textOverlay: '2️⃣ {{tip2}}',
      },
      {
        index: 4,
        durationSec: 5,
        action: 'Tip 3 demo + CTA',
        cameraAngle: 'Back to face',
        lightingTip: 'Front light',
        propsNeeded: [],
        textOverlay: '3️⃣ {{tip3}} → save this',
      },
    ],
    captionTemplate:
      'Save this for your next wash day 💇\n\nFollow for more haircare tips, or book a consult: {{bookingLink}}',
    hashtagSets: [
      {
        niche: 'salon',
        tags: ['#haircare', '#hairtips', '#hairstylist', '#hairsalon', '#salonindia', '#hairhealth', ...baseHashtags.reels],
      },
    ],
    audioMood: ['educational', 'trending', 'voiceover-friendly'],
    engagementTier: 'high',
    language: 'en',
    tags: ['tips', 'save-worthy'],
  },
];

/* ───────────────────────── RESTAURANT / FOOD ─────────────────────────────── */

const restaurantTemplates: ReelTemplateData[] = [
  {
    slug: 'restaurant-pov-dish-build',
    title: 'POV: Building the Signature Dish',
    category: 'product_showcase',
    vertical: 'restaurant',
    goal: 'awareness',
    difficulty: 'medium',
    estDurationSec: 25,
    shotCount: 6,
    structure: {
      hookSec: 1.5,
      patternInterruptSec: 6,
      ctaSec: 22,
      beats: ['Sizzle hook', 'Ingredients', 'Build', 'Plate', 'Final shot', 'CTA'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'Sizzling pan / steam / dramatic close-up',
        cameraAngle: 'Macro / very tight',
        lightingTip: 'Side-back light shows steam',
        propsNeeded: ['Pan', 'Hero ingredient'],
        textOverlay: 'POV: making your favourite {{dish}}',
      },
      {
        index: 2,
        durationSec: 4,
        action: 'Ingredients laid out — quick taps with finger',
        cameraAngle: 'Overhead flat lay',
        lightingTip: 'Soft top light, no shadows',
        propsNeeded: ['All ingredients'],
        textOverlay: 'we use only {{keyIngredient}}',
      },
      {
        index: 3,
        durationSec: 8,
        action: 'Cooking action — chopping, stirring, frying',
        cameraAngle: 'Mix overhead + side',
        lightingTip: 'Bright kitchen lighting',
        propsNeeded: [],
        textOverlay: 'no shortcuts',
      },
      {
        index: 4,
        durationSec: 4,
        action: 'Plating — careful, slow',
        cameraAngle: 'Slightly above plate, 30°',
        lightingTip: 'Soft side light',
        propsNeeded: ['Final plate'],
        textOverlay: 'plated to order',
      },
      {
        index: 5,
        durationSec: 4,
        action: 'Final hero shot — pull back, garnish drop',
        cameraAngle: '30° hero, slow zoom',
        lightingTip: 'Hero lighting — bright + soft',
        propsNeeded: ['Garnish'],
        textOverlay: '✨ {{dishName}}',
      },
      {
        index: 6,
        durationSec: 3,
        action: 'Customer takes first bite + smile',
        cameraAngle: 'Eye level',
        lightingTip: 'Natural',
        propsNeeded: ['Customer'],
        textOverlay: 'come taste it →  {{location}}',
      },
    ],
    captionTemplate:
      'Our signature {{dishName}}, made fresh every single time. ❤️\n\n📍 {{location}}\n📞 {{phone}}\nOpen {{hours}}',
    hashtagSets: [
      {
        niche: 'restaurant',
        tags: [
          '#foodreels',
          '#indianfood',
          '#foodporn',
          '#foodie',
          '#restaurantindia',
          '#delicious',
          '#foodphotography',
          '#chefslife',
          ...baseHashtags.reels,
        ],
      },
    ],
    audioMood: ['cinematic', 'food-asmr', 'trending'],
    engagementTier: 'high',
    language: 'en',
    tags: ['food-porn', 'process'],
  },
  {
    slug: 'restaurant-staff-favorite',
    title: 'Staff Picks Their Favorite Dish',
    category: 'testimonial',
    vertical: 'restaurant',
    goal: 'trust',
    difficulty: 'easy',
    estDurationSec: 30,
    shotCount: 4,
    structure: {
      hookSec: 1.5,
      ctaSec: 28,
      beats: ['Hook question', 'Staff 1 pick', 'Staff 2 pick', 'CTA'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'Walk through restaurant kitchen',
        cameraAngle: 'Walking POV',
        lightingTip: 'Natural kitchen light',
        propsNeeded: [],
        textOverlay: 'asked our team: what do YOU eat here?',
      },
      {
        index: 2,
        durationSec: 9,
        action: 'Staff 1 holds dish, takes bite, reacts',
        cameraAngle: 'Eye-level interview style',
        lightingTip: 'Soft front',
        propsNeeded: ['Dish 1'],
        textOverlay: '{{name1}} → {{dish1}}',
        voiceoverHint: 'Let staff speak naturally',
      },
      {
        index: 3,
        durationSec: 9,
        action: 'Staff 2 same format',
        cameraAngle: 'Eye-level',
        lightingTip: 'Same as above',
        propsNeeded: ['Dish 2'],
        textOverlay: '{{name2}} → {{dish2}}',
      },
      {
        index: 4,
        durationSec: 10,
        action: 'Both dishes on table + CTA',
        cameraAngle: 'Overhead',
        lightingTip: 'Bright',
        propsNeeded: [],
        textOverlay: 'try them both 👇',
      },
    ],
    captionTemplate:
      'When the kitchen team has favourites, you know it\'s good. 🔥\n\nThis week: {{dish1}} and {{dish2}}. Come hungry.',
    hashtagSets: [
      {
        niche: 'restaurant',
        tags: ['#staffpicks', '#restaurant', '#foodlover', '#indianrestaurant', '#chefspecial', ...baseHashtags.reels],
      },
    ],
    audioMood: ['warm', 'trending', 'fun'],
    engagementTier: 'medium',
    language: 'en',
    tags: ['authentic', 'team'],
  },
];

/* ───────────────────────── REAL ESTATE ───────────────────────────────────── */

const realEstateTemplates: ReelTemplateData[] = [
  {
    slug: 'realestate-property-walkthrough',
    title: '60-Second Property Walkthrough',
    category: 'product_showcase',
    vertical: 'real_estate',
    goal: 'conversion',
    difficulty: 'medium',
    estDurationSec: 45,
    shotCount: 6,
    structure: {
      hookSec: 1.5,
      patternInterruptSec: 8,
      ctaSec: 42,
      beats: ['Hook with price', 'Living', 'Kitchen', 'Bedroom', 'View / balcony', 'CTA'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'Front door — push open, reveal',
        cameraAngle: 'Wide, walking in',
        lightingTip: 'Open all curtains, lights on',
        propsNeeded: [],
        textOverlay: '{{bhk}} BHK in {{location}} for ₹{{price}}',
      },
      {
        index: 2,
        durationSec: 8,
        action: 'Slow pan across living room',
        cameraAngle: 'Wide, slow horizontal pan',
        lightingTip: 'Natural + interior lights',
        propsNeeded: [],
        textOverlay: '✨ Living: {{sqft}} sq ft',
      },
      {
        index: 3,
        durationSec: 8,
        action: 'Kitchen walk — open cabinets, show appliances',
        cameraAngle: 'Walking, eye level',
        lightingTip: 'Bright',
        propsNeeded: [],
        textOverlay: 'Modular kitchen with chimney',
      },
      {
        index: 4,
        durationSec: 8,
        action: 'Master bedroom — wide + closet',
        cameraAngle: 'Wide entry, then closet detail',
        lightingTip: 'Bright',
        propsNeeded: [],
        textOverlay: 'Master with attached bath',
      },
      {
        index: 5,
        durationSec: 12,
        action: 'Balcony view + amenities',
        cameraAngle: 'Wide, slow',
        lightingTip: 'Golden hour ideal',
        propsNeeded: [],
        textOverlay: 'View ✨ Pool ✨ Gym ✨ Park',
      },
      {
        index: 6,
        durationSec: 7,
        action: 'You on camera + CTA',
        cameraAngle: 'Selfie',
        lightingTip: 'Front light',
        propsNeeded: [],
        textOverlay: 'DM "{{keyword}}" to book a visit 👇',
      },
    ],
    captionTemplate:
      '{{bhk}} BHK in {{location}}\n📐 {{sqft}} sq ft\n💰 ₹{{price}}\n🏠 {{availability}}\n\nDM "VISIT" or call {{phone}} to book a site visit this weekend.',
    hashtagSets: [
      {
        niche: 'real_estate',
        tags: [
          '#realestateindia',
          '#propertyindia',
          '#realestate',
          '#dreamhome',
          '#flatforsale',
          '#propertytour',
          ...(baseHashtags.reels),
        ],
      },
    ],
    audioMood: ['aspirational', 'cinematic', 'soft'],
    engagementTier: 'high',
    language: 'en',
    tags: ['walkthrough', 'high-intent'],
  },
  {
    slug: 'realestate-mistake-warning',
    title: '5 Mistakes Buyers Make',
    category: 'educational',
    vertical: 'real_estate',
    goal: 'trust',
    difficulty: 'easy',
    estDurationSec: 35,
    shotCount: 6,
    structure: {
      hookSec: 1.5,
      patternInterruptSec: 7,
      ctaSec: 32,
      beats: ['Hook warning', '5 mistakes', 'CTA'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'Talk to camera, serious tone',
        cameraAngle: 'Selfie / interview',
        lightingTip: 'Front + ring',
        propsNeeded: [],
        textOverlay: 'I\'ve seen people lose ₹10L to these 5 mistakes',
        voiceoverHint: 'Hook with concrete number',
      },
      {
        index: 2,
        durationSec: 6,
        action: 'Mistake 1 — show example or graphic',
        cameraAngle: 'Mix talking head + b-roll',
        lightingTip: 'Bright',
        propsNeeded: [],
        textOverlay: '1️⃣ {{mistake1}}',
      },
      { index: 3, durationSec: 6, action: 'Mistake 2', cameraAngle: 'Same', lightingTip: 'Same', propsNeeded: [], textOverlay: '2️⃣ {{mistake2}}' },
      { index: 4, durationSec: 6, action: 'Mistake 3', cameraAngle: 'Same', lightingTip: 'Same', propsNeeded: [], textOverlay: '3️⃣ {{mistake3}}' },
      { index: 5, durationSec: 6, action: 'Mistake 4 + 5', cameraAngle: 'Same', lightingTip: 'Same', propsNeeded: [], textOverlay: '4️⃣ {{mistake4}}\n5️⃣ {{mistake5}}' },
      {
        index: 6,
        durationSec: 9,
        action: 'CTA — DM for checklist',
        cameraAngle: 'Selfie',
        lightingTip: 'Front',
        propsNeeded: [],
        textOverlay: 'DM "CHECKLIST" — I\'ll send my buyer guide',
      },
    ],
    captionTemplate:
      'Save this before your next site visit. 🏠\n\nFollow @{{handle}} for honest property advice. DM "CHECKLIST" for the full buyer guide.',
    hashtagSets: [
      {
        niche: 'real_estate',
        tags: ['#realestatetips', '#homebuying', '#realestateindia', '#propertyadvice', '#firsttimebuyer', ...baseHashtags.reels],
      },
    ],
    audioMood: ['educational', 'serious', 'voiceover-friendly'],
    engagementTier: 'high',
    language: 'en',
    tags: ['educational', 'authority'],
  },
];

/* ───────────────────────── FITNESS / GYM / COACH ─────────────────────────── */

const fitnessTemplates: ReelTemplateData[] = [
  {
    slug: 'fitness-workout-3-moves',
    title: '3 Moves for Your {{goal}}',
    category: 'tutorial',
    vertical: 'fitness',
    goal: 'engagement',
    difficulty: 'easy',
    estDurationSec: 25,
    shotCount: 4,
    structure: {
      hookSec: 1.5,
      patternInterruptSec: 6,
      ctaSec: 22,
      beats: ['Hook with goal', '3 moves', 'CTA'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'Quick intro — point to body part',
        cameraAngle: 'Half body, eye level',
        lightingTip: 'Bright gym lighting',
        propsNeeded: [],
        textOverlay: '3 moves to fix your {{goal}}',
      },
      {
        index: 2,
        durationSec: 7,
        action: 'Move 1 — full demo, 2 reps',
        cameraAngle: 'Full body, side angle',
        lightingTip: 'Even gym lighting',
        propsNeeded: ['Equipment'],
        textOverlay: '1️⃣ {{move1}} — 3 sets x 12',
      },
      {
        index: 3,
        durationSec: 7,
        action: 'Move 2',
        cameraAngle: 'Same',
        lightingTip: 'Same',
        propsNeeded: [],
        textOverlay: '2️⃣ {{move2}} — 3 sets x 12',
      },
      {
        index: 4,
        durationSec: 9,
        action: 'Move 3 + CTA',
        cameraAngle: 'Pull to talking head end',
        lightingTip: 'Front',
        propsNeeded: [],
        textOverlay: '3️⃣ {{move3}}\n\nSave this 💪',
      },
    ],
    captionTemplate:
      'Save this for {{goal}} day. 💪\n\nDM "PROGRAM" for my full {{duration}}-week plan. ₹{{price}}.',
    hashtagSets: [
      {
        niche: 'fitness',
        tags: ['#workout', '#fitness', '#gymindia', '#fitnesstips', '#fitindia', '#homeworkout', ...baseHashtags.reels],
      },
    ],
    audioMood: ['high-energy', 'motivational', 'trending'],
    engagementTier: 'high',
    language: 'en',
    tags: ['workout', 'tutorial'],
  },
];

/* ───────────────────────── D2C / SHOPIFY / RETAIL ────────────────────────── */

const d2cTemplates: ReelTemplateData[] = [
  {
    slug: 'd2c-unbox-experience',
    title: 'Unboxing the {{product}}',
    category: 'product_showcase',
    vertical: 'd2c',
    goal: 'conversion',
    difficulty: 'easy',
    estDurationSec: 20,
    shotCount: 5,
    structure: {
      hookSec: 1.5,
      patternInterruptSec: 5,
      ctaSec: 18,
      beats: ['Hook with package', 'Open', 'Reveal', 'Use', 'CTA'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'Hands holding sealed package',
        cameraAngle: 'Overhead or eye level',
        lightingTip: 'Bright, soft front',
        propsNeeded: ['Package'],
        textOverlay: 'finally arrived 📦',
      },
      {
        index: 2,
        durationSec: 4,
        action: 'Slow open — tape, lift flap',
        cameraAngle: 'Overhead',
        lightingTip: 'Even',
        propsNeeded: [],
        textOverlay: 'unboxing {{product}}',
      },
      {
        index: 3,
        durationSec: 5,
        action: 'Reveal product, tags, packaging detail',
        cameraAngle: 'Closeup',
        lightingTip: 'Soft side light',
        propsNeeded: [],
        textOverlay: 'first impressions ✨',
      },
      {
        index: 4,
        durationSec: 6,
        action: 'Try / use product on camera',
        cameraAngle: 'Mix',
        lightingTip: 'Bright',
        propsNeeded: [],
        textOverlay: '{{feature}} actually works',
      },
      {
        index: 5,
        durationSec: 3,
        action: 'CTA + discount',
        cameraAngle: 'Selfie',
        lightingTip: 'Front',
        propsNeeded: [],
        textOverlay: 'use {{code}} for 10% off → link in bio',
      },
    ],
    captionTemplate:
      '{{product}} just arrived and we had to share. 📦✨\n\nUse code {{code}} for 10% off. Link in bio.',
    hashtagSets: [
      {
        niche: 'd2c',
        tags: [
          '#unboxing',
          '#d2cindia',
          '#smallbusiness',
          '#shopindian',
          '#newproduct',
          '#packaging',
          ...baseHashtags.reels,
          ...baseHashtags.india,
        ],
      },
    ],
    audioMood: ['satisfying', 'aesthetic', 'trending'],
    engagementTier: 'high',
    language: 'en',
    tags: ['unboxing', 'product-launch'],
  },
];

/* ───────────────────────── FOUNDER STORY (universal) ────────────────────── */

const founderTemplates: ReelTemplateData[] = [
  {
    slug: 'founder-why-i-built-this',
    title: 'Why I Built This (Founder Story)',
    category: 'founder_story',
    vertical: 'generic',
    goal: 'trust',
    difficulty: 'medium',
    estDurationSec: 45,
    shotCount: 5,
    structure: {
      hookSec: 1.5,
      patternInterruptSec: 10,
      ctaSec: 42,
      beats: ['Hook with problem', 'Personal struggle', 'Insight', 'Build', 'CTA'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'Direct to camera, speak from heart',
        cameraAngle: 'Eye-level interview',
        lightingTip: 'Soft front, warm tone',
        propsNeeded: [],
        textOverlay: '4 years ago, I had this exact problem',
        voiceoverHint: 'Conversational, genuine',
      },
      {
        index: 2,
        durationSec: 12,
        action: 'B-roll of struggle / old photos / context',
        cameraAngle: 'Mix b-roll over voiceover',
        lightingTip: 'Match mood — softer is fine',
        propsNeeded: ['Old photos / archive'],
        textOverlay: 'the real story',
      },
      {
        index: 3,
        durationSec: 10,
        action: 'Back to camera — the insight moment',
        cameraAngle: 'Eye-level',
        lightingTip: 'Same',
        propsNeeded: [],
        textOverlay: '{{insight}}',
      },
      {
        index: 4,
        durationSec: 13,
        action: 'B-roll of building, team, product',
        cameraAngle: 'Mix',
        lightingTip: 'Whatever fits',
        propsNeeded: [],
        textOverlay: 'so we built this',
      },
      {
        index: 5,
        durationSec: 8,
        action: 'CTA — direct ask',
        cameraAngle: 'Eye-level',
        lightingTip: 'Front',
        propsNeeded: [],
        textOverlay: 'try it free → link in bio',
      },
    ],
    captionTemplate:
      'Honest story of why we built {{brand}}. 🙏\n\nNo polish, no script. If this resonates, the link is in our bio.',
    hashtagSets: [
      {
        niche: 'founder',
        tags: ['#founderstory', '#startupindia', '#smallbusinessjourney', '#entrepreneurlife', ...baseHashtags.reels, ...baseHashtags.india],
      },
    ],
    audioMood: ['emotional', 'cinematic', 'voiceover-friendly'],
    engagementTier: 'high',
    language: 'en',
    tags: ['story', 'authority', 'trust'],
  },
];

/* ───────────────────────── EDUCATION / COACH / CLINIC ────────────────────── */

const educationTemplates: ReelTemplateData[] = [
  {
    slug: 'edu-myth-vs-fact',
    title: 'Myth vs Fact (split-screen)',
    category: 'educational',
    vertical: 'education',
    goal: 'engagement',
    difficulty: 'easy',
    estDurationSec: 25,
    shotCount: 4,
    structure: {
      hookSec: 1.5,
      patternInterruptSec: 6,
      ctaSec: 22,
      beats: ['Hook with myth', 'Reveal myth', 'Reveal fact', 'CTA'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'Talking head, pointing finger',
        cameraAngle: 'Selfie',
        lightingTip: 'Front',
        propsNeeded: [],
        textOverlay: 'EVERYONE believes this... and it\'s wrong',
      },
      {
        index: 2,
        durationSec: 7,
        action: 'State the myth — graphic on screen',
        cameraAngle: 'Same',
        lightingTip: 'Same',
        propsNeeded: [],
        textOverlay: '❌ Myth: {{myth}}',
      },
      {
        index: 3,
        durationSec: 11,
        action: 'Reveal the fact — explain why',
        cameraAngle: 'Same + b-roll if any',
        lightingTip: 'Same',
        propsNeeded: [],
        textOverlay: '✅ Fact: {{fact}}',
      },
      {
        index: 4,
        durationSec: 5,
        action: 'CTA',
        cameraAngle: 'Same',
        lightingTip: 'Same',
        propsNeeded: [],
        textOverlay: 'follow for more 💡',
      },
    ],
    captionTemplate:
      'Save this 💡\n\nFollow for more {{topic}} content from a {{credential}}.',
    hashtagSets: [
      {
        niche: 'education',
        tags: ['#mythbuster', '#education', '#learning', '#facts', ...baseHashtags.reels],
      },
    ],
    audioMood: ['educational', 'curious', 'trending'],
    engagementTier: 'high',
    language: 'en',
    tags: ['myth-bust', 'shareable'],
  },
];

/* ───────────────────────── TREND-RIDING (vertical-agnostic) ──────────────── */

const trendTemplates: ReelTemplateData[] = [
  {
    slug: 'trend-tell-me-without',
    title: '"Tell me you\'re a {{X}} without telling me"',
    category: 'trend_riding',
    vertical: 'generic',
    goal: 'engagement',
    difficulty: 'easy',
    estDurationSec: 15,
    shotCount: 3,
    structure: {
      hookSec: 1.5,
      patternInterruptSec: 4,
      ctaSec: 13,
      beats: ['Hook trend phrase', 'Visual examples', 'CTA'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'On camera, hold up a finger',
        cameraAngle: 'Selfie',
        lightingTip: 'Front',
        propsNeeded: [],
        textOverlay: 'tell me you\'re a {{role}} without telling me',
      },
      {
        index: 2,
        durationSec: 10,
        action: 'Quick cuts of role-specific objects, situations',
        cameraAngle: 'Mix closeups',
        lightingTip: 'Whatever',
        propsNeeded: ['Role-specific items'],
        textOverlay: '...',
      },
      {
        index: 3,
        durationSec: 3,
        action: 'Back to face, knowing smile + CTA',
        cameraAngle: 'Selfie',
        lightingTip: 'Front',
        propsNeeded: [],
        textOverlay: 'comment yours 👇',
      },
    ],
    captionTemplate:
      'Drop yours in the comments 👇\n\nFollow for more {{role}} content.',
    hashtagSets: [
      {
        niche: 'trend',
        tags: ['#trending', '#reels', '#viral', '#explorepage', ...baseHashtags.reels],
      },
    ],
    audioMood: ['trending', 'viral'],
    engagementTier: 'high',
    language: 'en',
    tags: ['trend', 'low-effort'],
  },
];

/* ───────────────────────── CLINIC / DOCTOR ───────────────────────────────── */

const clinicTemplates: ReelTemplateData[] = [
  {
    slug: 'clinic-debunk-symptom',
    title: 'When to Worry About {{symptom}}',
    category: 'educational',
    vertical: 'clinic',
    goal: 'trust',
    difficulty: 'easy',
    estDurationSec: 30,
    shotCount: 4,
    structure: {
      hookSec: 1.5,
      patternInterruptSec: 7,
      ctaSec: 27,
      beats: ['Hook with concern', 'Normal', 'Worry signs', 'CTA'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'Doctor on camera, white coat',
        cameraAngle: 'Eye-level interview',
        lightingTip: 'Soft front',
        propsNeeded: ['Stethoscope optional'],
        textOverlay: 'Should you worry about {{symptom}}?',
        voiceoverHint: 'Calm, authoritative',
      },
      {
        index: 2,
        durationSec: 9,
        action: 'Explain what\'s normal',
        cameraAngle: 'Same',
        lightingTip: 'Same',
        propsNeeded: [],
        textOverlay: '✅ Usually normal if...',
      },
      {
        index: 3,
        durationSec: 12,
        action: 'Explain red flags',
        cameraAngle: 'Same',
        lightingTip: 'Same',
        propsNeeded: [],
        textOverlay: '⚠️ See a doctor if...',
      },
      {
        index: 4,
        durationSec: 7,
        action: 'CTA',
        cameraAngle: 'Same',
        lightingTip: 'Same',
        propsNeeded: [],
        textOverlay: 'Book a consult: {{phone}}',
      },
    ],
    captionTemplate:
      'Disclaimer: This is general info, not personal medical advice. If you\'re worried, please consult a doctor.\n\nBook a consult: {{phone}} | {{clinic}}',
    hashtagSets: [
      {
        niche: 'clinic',
        tags: ['#health', '#doctor', '#medicaladvice', '#wellness', '#healthtips', ...baseHashtags.reels],
      },
    ],
    audioMood: ['calm', 'voiceover-friendly', 'professional'],
    engagementTier: 'medium',
    language: 'en',
    tags: ['educational', 'authority'],
  },
];

/* ───────────────────────── TECH / SAAS ───────────────────────────────────── */

const techTemplates: ReelTemplateData[] = [
  {
    slug: 'tech-feature-demo-30s',
    title: 'Feature Demo in 30s',
    category: 'product_showcase',
    vertical: 'tech',
    goal: 'conversion',
    difficulty: 'easy',
    estDurationSec: 30,
    shotCount: 4,
    structure: {
      hookSec: 1.5,
      patternInterruptSec: 8,
      ctaSec: 27,
      beats: ['Pain hook', 'Show feature', 'Show result', 'CTA'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'Talking head with frustration',
        cameraAngle: 'Selfie',
        lightingTip: 'Front',
        propsNeeded: [],
        textOverlay: 'Spending {{hours}}h/week on {{problem}}? Stop.',
      },
      {
        index: 2,
        durationSec: 12,
        action: 'Screen record of feature in action',
        cameraAngle: 'Screen rec',
        lightingTip: 'N/A',
        propsNeeded: ['Laptop / phone'],
        textOverlay: '✨ {{feature}}',
      },
      {
        index: 3,
        durationSec: 9,
        action: 'Show outcome — time saved, result',
        cameraAngle: 'Mix',
        lightingTip: 'Bright',
        propsNeeded: [],
        textOverlay: '→ {{result}}',
      },
      {
        index: 4,
        durationSec: 7,
        action: 'CTA',
        cameraAngle: 'Selfie',
        lightingTip: 'Front',
        propsNeeded: [],
        textOverlay: 'try free → link in bio',
      },
    ],
    captionTemplate:
      'If you\'re still doing {{problem}} manually, this is for you.\n\n{{result}} in 60 seconds. Try free at {{link}}.',
    hashtagSets: [
      {
        niche: 'tech',
        tags: ['#saas', '#productivity', '#tech', '#automation', '#startupindia', ...baseHashtags.reels],
      },
    ],
    audioMood: ['upbeat', 'tech', 'trending'],
    engagementTier: 'medium',
    language: 'en',
    tags: ['demo', 'feature'],
  },
];

/* ───────────────────────── HINDI / LANGUAGE VARIANTS ─────────────────────── */

const hindiTemplates: ReelTemplateData[] = [
  {
    slug: 'salon-before-after-3shot-hi',
    title: 'Before / After Transformation (Hindi)',
    category: 'before_after',
    vertical: 'salon',
    goal: 'engagement',
    difficulty: 'easy',
    estDurationSec: 15,
    shotCount: 3,
    structure: {
      hookSec: 1.5,
      patternInterruptSec: 5,
      ctaSec: 13,
      beats: ['Problem', 'Process', 'Reveal', 'CTA'],
    },
    shotList: [
      {
        index: 1,
        durationSec: 2,
        action: 'Client before',
        cameraAngle: 'Eye-level closeup',
        lightingTip: 'Soft front',
        propsNeeded: ['Salon setup'],
        textOverlay: 'POV: aise andar aaye',
      },
      {
        index: 2,
        durationSec: 8,
        action: 'Process cuts',
        cameraAngle: 'Mix',
        lightingTip: 'Ring light',
        propsNeeded: [],
        textOverlay: '⚡ jaadu',
      },
      {
        index: 3,
        durationSec: 5,
        action: 'Reveal',
        cameraAngle: 'Slightly low',
        lightingTip: 'Soft front',
        propsNeeded: [],
        textOverlay: 'aise bahar gaye ✨',
      },
    ],
    captionTemplate:
      '{{clientFirstName}} aaye the {{request}} ke liye. Yeh raha result. ✨\n\nDM "{{keyword}}" karein booking ke liye — is hafte sirf 3 slot bache hain.',
    hashtagSets: [
      {
        niche: 'salon-hi',
        tags: ['#hairtransformation', '#salonindia', '#hairreels', '#hairgoals', '#desisalon', ...baseHashtags.reels],
      },
    ],
    audioMood: ['upbeat', 'desi', 'satisfying'],
    engagementTier: 'high',
    language: 'hi',
    tags: ['hindi', 'transformation'],
  },
];

/* ───────────────────────── EXPORT ALL ────────────────────────────────────── */

export const REEL_TEMPLATES: ReelTemplateData[] = [
  ...salonTemplates,
  ...restaurantTemplates,
  ...realEstateTemplates,
  ...fitnessTemplates,
  ...d2cTemplates,
  ...founderTemplates,
  ...educationTemplates,
  ...trendTemplates,
  ...clinicTemplates,
  ...techTemplates,
  ...hindiTemplates,
];

export const VERTICALS = [
  'generic',
  'salon',
  'restaurant',
  'real_estate',
  'fitness',
  'd2c',
  'clinic',
  'coach',
  'retail',
  'education',
  'finance',
  'tech',
  'beauty',
  'hospitality',
] as const;

export const REEL_CATEGORIES = [
  'product_showcase',
  'bts',
  'educational',
  'before_after',
  'founder_story',
  'testimonial',
  'trend_riding',
  'day_in_life',
  'promo',
  'comparison',
  'tutorial',
  'story',
] as const;

export const REEL_GOALS = ['awareness', 'conversion', 'engagement', 'trust', 'educate', 'entertain'] as const;

/**
 * Engagement research used to design these templates:
 *
 * 1. HOOK (first 1.5s): 70% of viewers drop in first 3s if no hook.
 *    - Use bold text overlay + visual movement.
 *
 * 2. PATTERN INTERRUPT (3-8s): keeps watch-time above 50%.
 *    - Cut to a different angle, sound, or context.
 *
 * 3. INFORMATION DENSITY: 3-5 information points in 30s = saves > 1 / 50 views.
 *    - Don't overload. Pick 3-5.
 *
 * 4. CTA in last 2s: increases DMs by 3x vs no CTA.
 *    - Specific keyword > generic "DM us".
 *
 * 5. SAVES > LIKES for educational content.
 *    - Saves are weighted heavily by IG algorithm.
 *
 * 6. Native audio (trending sound) → 1.5-2x reach.
 *    - Templates marked audioMood: ['trending'] are good candidates.
 */
