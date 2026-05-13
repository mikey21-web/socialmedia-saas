export interface Angle {
  pillar: string;
  angle: string;
  reasoning: string;
  hookFormat: string;
  specificDetails: string;
  brandFitScore?: number;
  viralityScore?: number;
  noveltyScore?: number;
  trendAligned?: boolean;
}

export interface IdeationResult {
  angles: Angle[];
}

export interface PlatformDraft {
  platform: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  fullCaption: string;
}

export interface PlatformCharLimits {
  twitter: 280;
  instagram: 200;
  linkedin: 300;
  facebook: 250;
  tiktok: 150;
}

export interface ComplianceResult {
  passed: boolean;
  violations: string[];
  correctedCaption?: string;
}

export interface StepResult {
  name: string;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  output: unknown;
}

export interface GenerateInput {
  topic: string;
  platforms: string[];
  intent?: string;
}

export interface WinningPattern {
  topics: string[];
  formats: string[];
  timings: { platform: string; bestTime: string }[];
  hashtags: string[];
}

export interface CompetitorInsight {
  handle: string;
  platform: string;
  topTopics: string[];
  engagementRate: string;
  strengths: string[];
  weaknesses: string[];
  recentContent?: string[];
}

export interface TrendContext {
  platform: string;
  signalType: string;
  value: string;
  popularity: number;
  velocity: number;
}

export interface EnrichedContext {
  winningPatterns?: WinningPattern;
  competitorInsights: CompetitorInsight[];
  trendSignals: TrendContext[];
  recentTopPerformers: { title: string; impressions: number; platform?: string }[];
  recentFlops: { title: string; impressions: number; reason?: string }[];
}