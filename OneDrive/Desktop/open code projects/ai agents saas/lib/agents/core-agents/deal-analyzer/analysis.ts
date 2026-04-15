export interface DealAnalysis {
  dealSize: number;
  industry: string;
  stage: string;
  complexity: string;
  stakeholders: number;
}

export const analyzeDeal = async (dealDescription: string): Promise<DealAnalysis> => {
  return {
    dealSize: 100000,
    industry: 'SaaS',
    stage: 'Advanced Negotiation',
    complexity: 'Medium',
    stakeholders: 4,
  };
};
