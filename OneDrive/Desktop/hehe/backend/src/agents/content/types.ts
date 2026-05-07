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
