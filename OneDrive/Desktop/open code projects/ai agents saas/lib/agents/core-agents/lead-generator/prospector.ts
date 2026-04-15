/**
 * Lead Prospector Agent
 * Finds potential leads based on business type and search query
 */

export interface Prospect {
  id: string;
  name: string;
  company: string;
  source: string;
  score: number;
  email?: string;
  phone?: string;
  industry?: string;
}

const PROSPECT_SOURCES = {
  real_estate: ['LinkedIn', 'Zillow', 'Realtor.com', 'MLS', 'Local Brokers'],
  ecommerce: ['LinkedIn', 'Shopify App Store', 'Amazon Seller Forum', 'Industry Databases'],
  saas: ['LinkedIn', 'G2', 'ProductHunt', 'Tech Communities'],
  coaching: ['LinkedIn', 'Udemy', 'Teachable', 'Social Media'],
  manufacturing: ['LinkedIn', 'Industry Directories', 'Trade Shows', 'B2B Databases'],
  healthcare: ['LinkedIn', 'Medical Associations', 'Hospital Directories', 'Industry Events'],
  services: ['LinkedIn', 'Local Directories', 'Google Maps', 'Industry Forums'],
  unknown: ['LinkedIn', 'Industry Databases', 'Social Media'],
};

export async function findProspects(
  query: string,
  businessType: string = 'unknown'
): Promise<Prospect[]> {
  const sources = PROSPECT_SOURCES[businessType as keyof typeof PROSPECT_SOURCES] || PROSPECT_SOURCES.unknown;

  // Simulate finding 25 prospects with varied sources and relevance scores
  const prospects: Prospect[] = Array.from({ length: 25 }, (_, i) => ({
    id: `prospect-${businessType}-${i}`,
    name: `${['John', 'Sarah', 'Mike', 'Emma', 'David'][i % 5]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(i / 5) % 5]}`,
    company: `${['Tech', 'Global', 'Prime', 'Smart', 'Digital'][i % 5]} Corp ${i + 1}`,
    source: sources[i % sources.length],
    score: Math.random() * 100,
    email: `lead${i}@company.com`,
    phone: `+1-555-${String(1000 + i).padStart(4, '0')}`,
    industry: businessType,
  }));

  return prospects;
}
