export const AGENCY_TIERS = {
  solo: {
    id: 'solo',
    name: 'Solo',
    priceInr: 2999,
    stripePriceIdEnv: 'STRIPE_SOLO_PRICE_ID',
    features: {
      platformsPerAccount: 2,
      postsPerMonth: 30,
      brandVoiceProfiles: 1,
      carouselsPerMonth: 5,
      teamMembers: 1,
      aiRunsPerDay: 50,
      reportsPerWeek: 1,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceInr: 9999,
    stripePriceIdEnv: 'STRIPE_PRO_PRICE_ID',
    features: {
      platformsPerAccount: 5,
      postsPerMonth: 90,
      brandVoiceProfiles: 3,
      carouselsPerMonth: 20,
      teamMembers: 3,
      aiRunsPerDay: 200,
      reportsPerWeek: 3,
      competitorTracking: true,
    },
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    priceInr: 19999,
    stripePriceIdEnv: 'STRIPE_AGENCY_PRICE_ID',
    features: {
      platformsPerAccount: 5,
      postsPerMonth: 300,
      brandVoiceProfiles: 10,
      carouselsPerMonth: 60,
      teamMembers: 10,
      aiRunsPerDay: 1000,
      reportsPerWeek: 7,
      competitorTracking: true,
      whitelabel: true,
      multiAccount: 5,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceInr: 49999,
    stripePriceIdEnv: 'STRIPE_ENTERPRISE_PRICE_ID',
    features: {
      unlimited: true,
      multiAccount: 50,
      whitelabel: true,
      dedicatedSupport: true,
      sla: '4-hour response',
      customIntegrations: true,
    },
  },
} as const;

export type AgencyTier = keyof typeof AGENCY_TIERS;
export type AgencyTierConfig = typeof AGENCY_TIERS[AgencyTier];
