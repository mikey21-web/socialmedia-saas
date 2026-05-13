export interface HookTemplate {
  format: string;
  example: string;
  platforms: string[];
  engagement: 'very_high' | 'high' | 'medium';
  category: 'contrarian' | 'pov' | 'story' | 'numbers' | 'curiosity' | 'challenge' | 'social_proof' | 'vulnerable' | 'listicle' | 'trending_format';
}

export const HOOK_LIBRARY: HookTemplate[] = [
  // ─── Contrarian / Hot Take ──────────────────────────────────────
  {
    format: 'Stop [common advice]. Here\'s what actually works:',
    example: 'Stop posting motivational quotes. Here\'s what actually works:',
    platforms: ['twitter', 'linkedin', 'instagram'],
    engagement: 'very_high',
    category: 'contrarian',
  },
  {
    format: 'Unpopular opinion: [contrarian take about industry]',
    example: 'Unpopular opinion: Your logo doesn\'t matter as much as you think.',
    platforms: ['twitter', 'linkedin', 'instagram'],
    engagement: 'very_high',
    category: 'contrarian',
  },
  {
    format: '[Industry] is lying to you about [thing]. The truth:',
    example: 'The fitness industry is lying to you about supplements. The truth:',
    platforms: ['twitter', 'linkedin', 'instagram', 'tiktok'],
    engagement: 'very_high',
    category: 'contrarian',
  },
  {
    format: 'I\'ve [done X for Y years]. [Biggest lesson] is NOT what you think.',
    example: 'I\'ve run a salon for 12 years. The #1 client retention secret is NOT what you think.',
    platforms: ['linkedin', 'instagram', 'facebook'],
    engagement: 'very_high',
    category: 'contrarian',
  },

  // ─── POV / Relatable ───────────────────────────────────────────
  {
    format: 'POV: [specific relatable scenario]',
    example: 'POV: Your client asked for "just a trim" and you gave them a whole new identity 💇‍♀️',
    platforms: ['instagram', 'tiktok'],
    engagement: 'very_high',
    category: 'pov',
  },
  {
    format: 'Nobody talks about [hidden truth in industry]',
    example: 'Nobody talks about how lonely running a small business actually is.',
    platforms: ['twitter', 'linkedin', 'instagram'],
    engagement: 'very_high',
    category: 'pov',
  },
  {
    format: 'Things I wish I knew before [starting/doing X]:',
    example: 'Things I wish I knew before opening my restaurant:',
    platforms: ['twitter', 'linkedin', 'instagram', 'tiktok'],
    engagement: 'high',
    category: 'pov',
  },
  {
    format: 'The part of [job/industry] nobody shows you:',
    example: 'The part of being a personal trainer nobody shows you:',
    platforms: ['instagram', 'tiktok', 'linkedin'],
    engagement: 'very_high',
    category: 'pov',
  },

  // ─── Story / Before-After ──────────────────────────────────────
  {
    format: '[Time ago], I [problem]. Today, [result]. Here\'s what changed:',
    example: '6 months ago, we had 200 followers. Today, 14K. Here\'s what changed:',
    platforms: ['twitter', 'linkedin', 'instagram'],
    engagement: 'very_high',
    category: 'story',
  },
  {
    format: 'This [client/customer] came to us with [problem]. [X weeks] later:',
    example: 'This client came to us with damaged, over-processed hair. 8 weeks later:',
    platforms: ['instagram', 'facebook', 'tiktok'],
    engagement: 'very_high',
    category: 'story',
  },
  {
    format: 'A [customer type] DM\'d us saying "[quote]". Here\'s what we did:',
    example: 'A bride-to-be DM\'d us saying "I hate my hair." Here\'s what we did:',
    platforms: ['instagram', 'facebook'],
    engagement: 'high',
    category: 'story',
  },

  // ─── Numbers / Data ────────────────────────────────────────────
  {
    format: 'We tested [X] for [Y days]. Results: [specific number].',
    example: 'We tested posting reels at 6AM for 30 days. Results: 340% more reach.',
    platforms: ['twitter', 'linkedin', 'instagram'],
    engagement: 'very_high',
    category: 'numbers',
  },
  {
    format: '[Specific stat] — and most [businesses/people] don\'t even know it.',
    example: '73% of salon clients rebook because of the consultation, not the cut — and most stylists skip it.',
    platforms: ['twitter', 'linkedin', 'instagram'],
    engagement: 'high',
    category: 'numbers',
  },
  {
    format: 'In [time period], we went from [A] to [B]. The [number] things that moved the needle:',
    example: 'In 90 days, we went from 2 bookings/day to 12. The 3 things that moved the needle:',
    platforms: ['linkedin', 'instagram', 'twitter'],
    engagement: 'very_high',
    category: 'numbers',
  },

  // ─── Curiosity Gap ─────────────────────────────────────────────
  {
    format: 'The [one thing] that [top performers] do differently:',
    example: 'The one thing that the top 1% of restaurants do differently:',
    platforms: ['linkedin', 'instagram', 'twitter'],
    engagement: 'high',
    category: 'curiosity',
  },
  {
    format: 'I just discovered why [surprising thing]. Mind blown.',
    example: 'I just discovered why my best posts always flop on Mondays. Mind blown.',
    platforms: ['twitter', 'linkedin'],
    engagement: 'high',
    category: 'curiosity',
  },
  {
    format: 'This is the exact [strategy/process/tool] I use to [result]:',
    example: 'This is the exact DM script I use to turn followers into paying clients:',
    platforms: ['instagram', 'linkedin', 'twitter'],
    engagement: 'very_high',
    category: 'curiosity',
  },

  // ─── Challenge / CTA Heavy ─────────────────────────────────────
  {
    format: 'Try this for [X days] and watch what happens:',
    example: 'Try this for 7 days and watch your engagement triple:',
    platforms: ['instagram', 'tiktok', 'twitter'],
    engagement: 'high',
    category: 'challenge',
  },
  {
    format: 'Save this for when you [specific situation]:',
    example: 'Save this for when you don\'t know what to post 📌',
    platforms: ['instagram', 'tiktok'],
    engagement: 'high',
    category: 'challenge',
  },

  // ─── Social Proof ──────────────────────────────────────────────
  {
    format: '"[Real customer quote]" — This is why we do what we do.',
    example: '"I haven\'t felt this confident in years." — This is why we do what we do.',
    platforms: ['instagram', 'facebook', 'linkedin'],
    engagement: 'high',
    category: 'social_proof',
  },
  {
    format: 'Our [most common compliment from clients/customers]. Let me explain why:',
    example: 'Our most common Google review says "felt like family." Let me explain why:',
    platforms: ['instagram', 'facebook', 'linkedin'],
    engagement: 'high',
    category: 'social_proof',
  },

  // ─── Vulnerable / Human ────────────────────────────────────────
  {
    format: 'I almost [quit/closed/gave up] [when]. Then [turning point].',
    example: 'I almost closed my clinic last March. Then one patient changed everything.',
    platforms: ['linkedin', 'instagram', 'facebook'],
    engagement: 'very_high',
    category: 'vulnerable',
  },
  {
    format: 'Real talk: [honest admission about business/industry]',
    example: 'Real talk: I lost money on half my promotions this year. Here\'s what I learned:',
    platforms: ['twitter', 'linkedin', 'instagram'],
    engagement: 'very_high',
    category: 'vulnerable',
  },

  // ─── Listicle / Value Dump ─────────────────────────────────────
  {
    format: '[X] [things/mistakes/secrets] I learned from [specific experience]:',
    example: '5 pricing mistakes I made in my first year of freelancing:',
    platforms: ['twitter', 'linkedin', 'instagram', 'tiktok'],
    engagement: 'high',
    category: 'listicle',
  },
  {
    format: 'Your [year/month] cheat sheet for [goal]:',
    example: 'Your June content cheat sheet for maximum engagement:',
    platforms: ['instagram', 'tiktok', 'twitter'],
    engagement: 'high',
    category: 'listicle',
  },

  // ─── Trending Formats (2024-2026) ──────────────────────────────
  {
    format: 'What I ordered vs what I got: [expectation vs reality]',
    example: 'What I ordered vs what I got: (client expectations vs salon reality)',
    platforms: ['instagram', 'tiktok'],
    engagement: 'high',
    category: 'trending_format',
  },
  {
    format: 'Tell me you\'re a [profession] without telling me you\'re a [profession]',
    example: 'Tell me you\'re a chef without telling me you\'re a chef 🔪',
    platforms: ['tiktok', 'instagram'],
    engagement: 'high',
    category: 'trending_format',
  },
  {
    format: 'Day in the life of a [role] who [specific detail]:',
    example: 'Day in the life of a salon owner who also does all the color corrections:',
    platforms: ['tiktok', 'instagram'],
    engagement: 'high',
    category: 'trending_format',
  },
];

export function getHooksForPlatform(platform: string, count = 5): HookTemplate[] {
  const matching = HOOK_LIBRARY.filter(h => h.platforms.includes(platform));
  const sorted = matching.sort((a, b) => {
    const rank = { very_high: 3, high: 2, medium: 1 };
    return rank[b.engagement] - rank[a.engagement];
  });
  // Shuffle within the same engagement tier for variety
  const shuffled = sorted.sort((a, b) => {
    if (a.engagement === b.engagement) return Math.random() - 0.5;
    return 0;
  });
  return shuffled.slice(0, count);
}

export function getHooksForCategory(category: HookTemplate['category'], platform?: string): HookTemplate[] {
  return HOOK_LIBRARY.filter(h =>
    h.category === category && (!platform || h.platforms.includes(platform))
  );
}

export function formatHooksForPrompt(hooks: HookTemplate[]): string {
  return hooks.map((h, i) =>
    `${i + 1}. FORMAT: "${h.format}"\n   EXAMPLE: "${h.example}" [${h.engagement} engagement]`
  ).join('\n');
}
