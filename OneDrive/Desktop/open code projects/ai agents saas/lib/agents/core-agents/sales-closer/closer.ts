/**
 * Deal Closing Sub-Agent
 * Generates and executes closing strategies based on all signals
 */

interface ClosingStrategy {
  approach: string;
  nextSteps: string[];
  successRate: number;
  recommendedAction: string;
}

export async function closeDeal(
  temperature: number,
  objectionsHandled: number,
  urgencyLevel: 'low' | 'medium' | 'high' = 'medium'
): Promise<ClosingStrategy> {
  // Calculate base closing success rate from temperature
  const tempScore = (temperature / 100) * 70;

  // Add boost from objections handled
  const objectionBoost = Math.min(20, objectionsHandled * 5);

  // Add urgency modifier
  let urgencyBoost = 0;
  if (urgencyLevel === 'high') {
    urgencyBoost = 15;
  } else if (urgencyLevel === 'medium') {
    urgencyBoost = 8;
  }

  const successRate = Math.min(95, tempScore + objectionBoost + urgencyBoost);

  // Determine approach based on temperature
  let approach: string;
  let nextSteps: string[];
  let recommendedAction: string;

  if (temperature >= 75) {
    approach = 'Direct Close';
    nextSteps = [
      'Present final proposal',
      'Address any last-minute concerns',
      'Facilitate contract signing',
      'Schedule implementation kickoff',
    ];
    recommendedAction = 'Move directly to contract presentation and closing';
  } else if (temperature >= 50) {
    approach = 'Consultative Close';
    nextSteps = [
      'Review key benefits aligned to needs',
      'Provide ROI analysis',
      'Offer flexible payment options',
      'Schedule 3-day follow-up',
    ];
    recommendedAction = 'Address remaining concerns before presenting contract';
  } else {
    approach = 'Relationship Building';
    nextSteps = [
      'Send educational resources',
      'Offer extended trial period',
      'Schedule business review meeting',
      'Provide case studies and testimonials',
    ];
    recommendedAction = 'Focus on nurturing and building trust before closing attempt';
  }

  return {
    approach,
    nextSteps,
    successRate: Math.round(successRate),
    recommendedAction,
  };
}
