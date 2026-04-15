import { DealAnalysis } from './analysis';

export interface ScoringResult {
  dealScore: number;
  fitScore: number;
  timeline: string;
}

export const scoreDeal = async (analysis: DealAnalysis): Promise<ScoringResult> => {
  return {
    dealScore: 78,
    fitScore: 85,
    timeline: '30 days',
  };
};
