import { ProspectingResult } from './prospecting';

export interface EngagementResult {
  engagementLevel: string;
  interactions: number;
  sentiment: string;
}

export const engageProspect = async (prospecting: ProspectingResult): Promise<EngagementResult> => {
  return {
    engagementLevel: 'High',
    interactions: 3,
    sentiment: 'Positive',
  };
};
