export interface Angle {
  pillar: string;
  angle: string;
  reasoning: string;
  brandFitScore?: number;
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