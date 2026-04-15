/**
 * Urgency Creation Sub-Agent
 * Develops and applies urgency strategies based on deal temperature
 */

interface UrgencyStrategy {
  level: 'low' | 'medium' | 'high';
  tactics: string[];
  message: string;
}

export async function createUrgency(temperature: number): Promise<UrgencyStrategy> {
  let level: 'low' | 'medium' | 'high';
  let tactics: string[];
  let message: string;

  if (temperature >= 75) {
    level = 'high';
    tactics = [
      'Limited-time offer',
      'Exclusive pricing expires end of week',
      'Priority onboarding queue filling up',
      'Early adopter benefits available now',
    ];
    message = 'Position this as an exclusive opportunity with time-sensitive benefits';
  } else if (temperature >= 50) {
    level = 'medium';
    tactics = [
      'Standard pricing increases next quarter',
      'Implementation timeline gets longer as demand grows',
      'Free trial period with premium features',
      'Early access to new features',
    ];
    message = 'Create mild urgency around standard business processes';
  } else {
    level = 'low';
    tactics = [
      'Suggest scheduling follow-up meeting',
      'Provide resources for self-evaluation',
      'Offer extended trial period',
      'Propose low-commitment engagement',
    ];
    message = 'Focus on building trust and removing friction before creating urgency';
  }

  return {
    level,
    tactics,
    message,
  };
}
