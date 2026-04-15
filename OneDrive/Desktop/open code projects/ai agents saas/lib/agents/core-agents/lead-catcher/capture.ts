export interface CapturedLead {
  leadsFound: number;
  sources: string[];
  leadList: Array<{ id: string; name: string }>;
}

export const captureLead = async (source: string): Promise<CapturedLead> => {
  return {
    leadsFound: 5,
    sources: ['LinkedIn', 'Website Form', 'Email'],
    leadList: [
      { id: 'lead-1', name: 'John Prospect' },
      { id: 'lead-2', name: 'Jane Client' },
      { id: 'lead-3', name: 'Bob Buyer' },
      { id: 'lead-4', name: 'Alice Decision' },
      { id: 'lead-5', name: 'Charlie Opportunity' },
    ],
  };
};
