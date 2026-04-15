import { CapturedLead } from './capture';

export interface QualifiedLead {
  qualityScore: number;
  scoredLeads: Array<{ id: string; score: number }>;
  readyForFollowup: boolean;
}

export const qualifyLead = async (captured: CapturedLead): Promise<QualifiedLead> => {
  return {
    qualityScore: 85,
    scoredLeads: captured.leadList.map((lead) => ({
      id: lead.id,
      score: Math.floor(Math.random() * 40 + 60),
    })),
    readyForFollowup: true,
  };
};
