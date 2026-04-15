/**
 * Lead Qualifier Agent
 * Scores and qualifies leads based on multiple criteria
 */

import type { Prospect } from './prospector';

export interface QualifiedLead extends Prospect {
  qualityScore: number;
  fitLevel: 'high' | 'medium' | 'low';
  recommendedAction: string;
}

export interface QualificationResult {
  count: number;
  leads: QualifiedLead[];
  highFitCount: number;
  mediumFitCount: number;
  lowFitCount: number;
}

export async function qualifyLeads(prospects: Prospect[]): Promise<QualificationResult> {
  const qualified: QualifiedLead[] = prospects.map((prospect) => {
    // Combine initial score with qualification heuristics
    const baseScore = prospect.score;
    const hasEmail = prospect.email ? 10 : 0;
    const hasPhone = prospect.phone ? 10 : 0;
    const sourceBoost = prospect.source === 'LinkedIn' ? 15 : 5;

    const qualityScore = Math.min(100, baseScore + hasEmail + hasPhone + sourceBoost);

    // Determine fit level
    let fitLevel: 'high' | 'medium' | 'low' = 'low';
    let recommendedAction = 'Archive';

    if (qualityScore >= 75) {
      fitLevel = 'high';
      recommendedAction = 'Immediate outreach';
    } else if (qualityScore >= 55) {
      fitLevel = 'medium';
      recommendedAction = 'Nurture sequence';
    } else {
      fitLevel = 'low';
      recommendedAction = 'Archive';
    }

    return {
      ...prospect,
      qualityScore,
      fitLevel,
      recommendedAction,
    };
  });

  // Filter to show only qualified leads (medium and high fit)
  const qualifiedFiltered = qualified.filter((lead) => lead.fitLevel !== 'low');

  const highFitCount = qualified.filter((l) => l.fitLevel === 'high').length;
  const mediumFitCount = qualified.filter((l) => l.fitLevel === 'medium').length;
  const lowFitCount = qualified.filter((l) => l.fitLevel === 'low').length;

  return {
    count: qualifiedFiltered.length,
    leads: qualifiedFiltered,
    highFitCount,
    mediumFitCount,
    lowFitCount,
  };
}
