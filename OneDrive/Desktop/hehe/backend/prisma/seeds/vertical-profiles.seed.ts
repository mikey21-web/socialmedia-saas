import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VERTICALS = [
  {
    slug: 'd2c',
    name: 'D2C / E-commerce',
    description: 'Direct-to-consumer brands selling products online',
    contentPriorities: { showcases: 40, ugc: 30, education: 20, promotion: 10 },
    promptOverrides: {
      tone: 'Approachable, lifestyle-driven. Use social proof and urgency.',
      cta_style: 'Shop now, Link in bio, Limited stock',
      content_rules: 'Always feature product visually. UGC > studio shots.',
    },
    templateLibrary: [
      { name: 'Product Launch', structure: 'Hook → Problem → Solution (product) → CTA' },
      { name: 'Customer Review', structure: 'Quote → Product image → Before/After → CTA' },
      { name: 'Behind The Scenes', structure: 'Workshop/warehouse peek → Process → Quality highlight' },
      { name: 'Sale Announcement', structure: 'Urgency hook → Discount details → Bestsellers → Time limit' },
    ],
    recommendedHashtags: [
      '#ShopSmall', '#NewArrivals', '#HandmadeWithLove', '#SmallBusiness', '#ShopLocal',
      '#CustomerLove', '#ProductOfTheDay', '#BestSeller', '#LimitedEdition', '#FreeShipping',
      '#Unboxing', '#HaulVideo', '#StyleInspo', '#MustHave', '#TrendAlert',
    ],
    optimalPostingTimes: {
      instagram: ['09:00', '12:00', '19:00'],
      x: ['08:00', '12:30', '18:00'],
      facebook: ['10:00', '14:00', '20:00'],
      tiktok: ['07:00', '12:00', '17:00', '21:00'],
    },
  },
  {
    slug: 'b2b',
    name: 'B2B SaaS',
    description: 'Software-as-a-service businesses selling to other businesses',
    contentPriorities: { thought_leadership: 40, case_studies: 25, industry_news: 20, product: 15 },
    promptOverrides: {
      tone: 'Professional, data-driven, authoritative. Use stats and proof points.',
      cta_style: 'Book a demo, Read the case study, Download the whitepaper',
      content_rules: 'Lead with insights not features. Mention ROI whenever possible.',
    },
    templateLibrary: [
      { name: 'Thought Leadership', structure: 'Bold claim → Data → Insight → CTA' },
      { name: 'Case Study Highlight', structure: 'Client challenge → Solution → Results (numbers) → CTA' },
      { name: 'Industry Trend Take', structure: 'Trend observation → Our angle → How we solve it → CTA' },
      { name: 'Product Update', structure: 'What changed → Why it matters → How to use it → CTA' },
    ],
    recommendedHashtags: [
      '#SaaS', '#B2B', '#StartupLife', '#TechInnovation', '#DigitalTransformation',
      '#ProductivityHacks', '#LeadershipTips', '#GrowthHacking', '#CustomerSuccess', '#DataDriven',
      '#FutureOfWork', '#AIinBusiness', '#ScaleUp', '#FounderLife', '#Revenue',
    ],
    optimalPostingTimes: {
      linkedin: ['07:30', '10:00', '17:00'],
      x: ['08:00', '12:00', '16:00'],
      instagram: ['09:00', '13:00'],
      facebook: ['09:00', '14:00'],
    },
  },
  {
    slug: 'restaurant',
    name: 'Restaurant / Food & Beverage',
    description: 'Restaurants, cafes, cloud kitchens, and food brands',
    contentPriorities: { food_photos: 50, daily_specials: 20, behind_scenes: 15, customer_features: 15 },
    promptOverrides: {
      tone: 'Warm, inviting, sensory language. Make people hungry.',
      cta_style: 'Order now, Reserve a table, Visit us today',
      content_rules: 'Always use high-quality food imagery. Show the experience, not just the dish.',
    },
    templateLibrary: [
      { name: 'Dish Feature', structure: 'Appetizing close-up → Ingredients story → Price → CTA' },
      { name: 'Chef Special', structure: 'Chef intro → Special dish → Limited availability → CTA' },
      { name: 'Customer Moment', structure: 'Happy customer photo → Their quote → Menu item → CTA' },
      { name: 'Kitchen BTS', structure: 'Preparation process → Fresh ingredients → Passion → CTA' },
    ],
    recommendedHashtags: [
      '#Foodie', '#FoodPhotography', '#InstaFood', '#FoodLovers', '#ChefSpecial',
      '#FarmToTable', '#Yummy', '#FoodBlogger', '#EatLocal', '#Delicious',
      '#RestaurantLife', '#DailySpecial', '#FoodieFinds', '#Brunch', '#DinnerTime',
    ],
    optimalPostingTimes: {
      instagram: ['11:00', '13:00', '18:00', '20:00'],
      facebook: ['11:30', '17:00'],
      tiktok: ['12:00', '18:00', '21:00'],
      x: ['12:00', '18:00'],
    },
  },
  {
    slug: 'real_estate',
    name: 'Real Estate',
    description: 'Real estate agents, brokers, and property developers',
    contentPriorities: { listings: 40, market_insights: 25, client_wins: 20, area_highlights: 15 },
    promptOverrides: {
      tone: 'Trust-building, knowledgeable, local expert. Emphasize lifestyle.',
      cta_style: 'Schedule a viewing, DM for details, Link in bio for full tour',
      content_rules: 'Always include location, price range hints, and lifestyle benefits.',
    },
    templateLibrary: [
      { name: 'Property Listing', structure: 'Hero shot → Key features → Lifestyle benefit → CTA' },
      { name: 'Market Update', structure: 'Market stat → What it means → Your advice → CTA' },
      { name: 'Just Sold', structure: 'Property photo → Client story → Celebration → CTA' },
      { name: 'Neighborhood Guide', structure: 'Area highlight → Amenities → Property opportunities → CTA' },
    ],
    recommendedHashtags: [
      '#RealEstate', '#PropertyForSale', '#DreamHome', '#HouseHunting', '#JustSold',
      '#OpenHouse', '#LuxuryLiving', '#FirstTimeBuyer', '#Investment', '#HomeDecor',
      '#RealtorLife', '#NewListing', '#PropertyInvestment', '#HomeSweetHome', '#RealEstateAgent',
    ],
    optimalPostingTimes: {
      instagram: ['09:00', '12:00', '17:00'],
      linkedin: ['08:00', '12:00'],
      facebook: ['10:00', '14:00', '19:00'],
      x: ['09:00', '13:00'],
    },
  },
  {
    slug: 'coach',
    name: 'Coach / Consultant',
    description: 'Business coaches, life coaches, consultants, and mentors',
    contentPriorities: { value_content: 50, client_wins: 20, personal_brand: 20, cta: 10 },
    promptOverrides: {
      tone: 'Authoritative yet relatable. Share personal stories. Inspire action.',
      cta_style: 'Book a free call, DM me "GROWTH", Join my workshop',
      content_rules: 'Lead with value. Every post should teach something. Use client results as proof.',
    },
    templateLibrary: [
      { name: 'Micro-Lesson', structure: 'Problem statement → 3-5 tips → Summary → CTA' },
      { name: 'Client Transformation', structure: 'Before state → Process → After results → CTA' },
      { name: 'Personal Story', structure: 'Vulnerable moment → Lesson learned → Advice → CTA' },
      { name: 'Myth Busting', structure: 'Common myth → Why it is wrong → Truth → CTA' },
    ],
    recommendedHashtags: [
      '#BusinessCoach', '#Mindset', '#Entrepreneurship', '#GrowthMindset', '#SuccessTips',
      '#LifeCoach', '#Leadership', '#Motivation', '#PersonalDevelopment', '#CoachingTips',
      '#DigitalNomad', '#SideHustle', '#BossLife', '#MentorshipMatters', '#GoalSetting',
    ],
    optimalPostingTimes: {
      instagram: ['06:00', '09:00', '18:00'],
      linkedin: ['07:00', '10:00', '17:00'],
      x: ['07:00', '12:00', '18:00'],
      tiktok: ['08:00', '12:00', '20:00'],
    },
  },
  {
    slug: 'creator',
    name: 'Creator / Influencer',
    description: 'Content creators, YouTubers, influencers, and personal brands',
    contentPriorities: { niche_content: 60, community: 20, monetization: 10, personal: 10 },
    promptOverrides: {
      tone: 'Authentic, personality-driven, casual. Be yourself amplified.',
      cta_style: 'Like & save, Comment your answer, Share with a friend, Link in bio',
      content_rules: 'Prioritize personality over polish. Engage audience with questions. Trends are your friend.',
    },
    templateLibrary: [
      { name: 'Trending Reel', structure: 'Hook (2s) → Content → Twist/Punchline → CTA' },
      { name: 'Day In My Life', structure: 'Morning routine → Work/Creative process → Evening wind-down' },
      { name: 'Tutorial/How-To', structure: 'Problem → Step-by-step → Final result → CTA' },
      { name: 'Opinion/Hot Take', structure: 'Bold statement → Reasoning → Community prompt' },
    ],
    recommendedHashtags: [
      '#ContentCreator', '#CreatorLife', '#InfluencerMarketing', '#Viral', '#Trending',
      '#Aesthetic', '#GRWM', '#DayInMyLife', '#Tutorial', '#HowTo',
      '#Relatable', '#POV', '#ForYouPage', '#FYP', '#ReelsOfInstagram',
    ],
    optimalPostingTimes: {
      instagram: ['07:00', '12:00', '19:00', '21:00'],
      tiktok: ['07:00', '10:00', '14:00', '19:00', '22:00'],
      x: ['09:00', '14:00', '20:00'],
      youtube: ['15:00', '18:00'],
    },
  },
  {
    slug: 'generic',
    name: 'Generic / Other',
    description: 'Balanced content strategy for any type of business',
    contentPriorities: { educational: 30, promotional: 25, engaging: 25, brand_story: 20 },
    promptOverrides: {
      tone: 'Professional yet approachable. Balanced voice.',
      cta_style: 'Learn more, Visit our website, Follow for more',
      content_rules: 'Mix content types. Maintain consistency. Always include a CTA.',
    },
    templateLibrary: [
      { name: 'Educational Post', structure: 'Hook → 3 key points → Takeaway → CTA' },
      { name: 'Promotional', structure: 'Benefit → Feature → Social proof → CTA' },
      { name: 'Engagement Post', structure: 'Question/Poll → Context → Community prompt' },
      { name: 'Brand Story', structure: 'Origin/Mission → Value → Impact → CTA' },
    ],
    recommendedHashtags: [
      '#Business', '#Entrepreneur', '#Marketing', '#SmallBusiness', '#Growth',
      '#Tips', '#Insights', '#Community', '#Innovation', '#Success',
      '#DigitalMarketing', '#Strategy', '#Branding', '#ContentMarketing', '#SocialMedia',
    ],
    optimalPostingTimes: {
      instagram: ['09:00', '12:00', '18:00'],
      linkedin: ['08:00', '12:00', '17:00'],
      x: ['09:00', '13:00', '17:00'],
      facebook: ['09:00', '13:00', '19:00'],
      tiktok: ['09:00', '12:00', '19:00'],
    },
  },
];

async function seed() {
  console.log('Seeding vertical profiles...');

  for (const v of VERTICALS) {
    await prisma.verticalProfile.upsert({
      where: { slug: v.slug },
      update: {
        name: v.name,
        description: v.description,
        contentPriorities: v.contentPriorities,
        promptOverrides: v.promptOverrides,
        templateLibrary: v.templateLibrary,
        recommendedHashtags: v.recommendedHashtags,
        optimalPostingTimes: v.optimalPostingTimes,
      },
      create: {
        slug: v.slug,
        name: v.name,
        description: v.description,
        contentPriorities: v.contentPriorities,
        promptOverrides: v.promptOverrides,
        templateLibrary: v.templateLibrary,
        recommendedHashtags: v.recommendedHashtags,
        optimalPostingTimes: v.optimalPostingTimes,
      },
    });
    console.log(`  ✓ ${v.name}`);
  }

  console.log('Done seeding vertical profiles.');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
