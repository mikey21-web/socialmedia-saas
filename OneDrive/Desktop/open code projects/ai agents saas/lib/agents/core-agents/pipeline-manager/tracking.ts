export interface TrackingResult {
  dealsTracked: number;
  pipelineValue: number;
  stages: Record<string, number>;
}

export const trackPipeline = async (period: string): Promise<TrackingResult> => {
  return {
    dealsTracked: 25,
    pipelineValue: 500000,
    stages: {
      'Discovery': 8,
      'Qualification': 10,
      'Negotiation': 5,
      'Closing': 2,
    },
  };
};
