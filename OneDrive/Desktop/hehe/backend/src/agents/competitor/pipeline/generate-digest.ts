import { BrandContext } from '../../../brand/brand.service';
import { LlmService } from '../../llm/llm.service';
import {
  buildDigestPrompt,
  CompetitorSnapshotData,
} from '../prompts/digest.prompt';

export interface WeeklyDigest {
  summary: string;
  topPerforming: Array<{ competitor: string; what: string; why: string }>;
  gaps: Array<{ opportunity: string; reason: string }>;
  watchOut: string;
  recommendation: string;
}

export async function generateDigest(
  snapshots: CompetitorSnapshotData[],
  brand: BrandContext,
  llm: LlmService,
): Promise<WeeklyDigest> {
  if (snapshots.length === 0) {
    return {
      summary: 'No competitor data available yet. Add competitor handles in your brand settings.',
      topPerforming: [],
      gaps: [],
      watchOut: 'Add competitors to start tracking',
      recommendation: 'Set up competitor tracking in brand settings',
    };
  }

  const prompt = buildDigestPrompt(snapshots, brand);
  return llm.completeJson<WeeklyDigest>(prompt, { temperature: 0.4 });
}
