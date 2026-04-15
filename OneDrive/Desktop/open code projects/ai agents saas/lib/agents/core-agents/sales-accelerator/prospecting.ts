export interface ProspectingResult {
  prospectFound: boolean;
  prospectCount: number;
  targetList: string[];
}

export const conductProspecting = async (market: string): Promise<ProspectingResult> => {
  return {
    prospectFound: true,
    prospectCount: 10,
    targetList: ['Prospect A', 'Prospect B', 'Prospect C'],
  };
};
