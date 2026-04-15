import { QualifiedLead } from './qualify';

export interface FollowupResult {
  initiated: boolean;
  sequenceId: string;
  nextSteps: string[];
}

export const initiateFollowup = async (qualified: QualifiedLead): Promise<FollowupResult> => {
  return {
    initiated: true,
    sequenceId: `seq-${Date.now()}`,
    nextSteps: ['Send intro email', 'Schedule call', 'Demo presentation'],
  };
};
