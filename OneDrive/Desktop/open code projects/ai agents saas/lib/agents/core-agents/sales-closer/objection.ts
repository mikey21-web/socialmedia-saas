/**
 * Objection Handling Sub-Agent
 * Crafts responses to buyer objections and provides counterarguments
 */

interface ObjectionResponse {
  objection: string;
  response: string;
  effectiveness: number;
}

interface ObjectionResult {
  count: number;
  addressed: ObjectionResponse[];
  successRate: number;
}

const objectionResponses: Record<string, string[]> = {
  price: [
    'Consider the ROI: our solution typically pays for itself in 3-6 months',
    'We offer flexible payment plans to fit your budget',
    'The cost of NOT having this solution is higher due to inefficiencies',
  ],
  timing: [
    'The sooner you implement, the sooner you see results',
    'Market conditions favor early adopters in this space',
    'Delays often lead to missed opportunities',
  ],
  budget: [
    'We can start with a pilot program at a reduced cost',
    'Allocating budget here reduces costs in other areas',
    'The investment creates significant long-term savings',
  ],
  implementation: [
    'Our implementation team handles the entire setup process',
    'Integration typically takes 2-4 weeks with minimal disruption',
    'We provide comprehensive training and support',
  ],
  contract_terms: [
    'We can customize contract terms to suit your needs',
    'Flexible terms without compromising value delivery',
    'Our legal team is ready to negotiate favorable conditions',
  ],
};

export async function handleObjection(objections: string[]): Promise<ObjectionResult> {
  const addressed: ObjectionResponse[] = [];
  let successCount = 0;

  for (const objection of objections) {
    const responses = objectionResponses[objection] || objectionResponses.budget;
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    const effectiveness = Math.random() * 0.3 + 0.6; // 60-90% effectiveness

    if (effectiveness > 0.65) {
      successCount++;
    }

    addressed.push({
      objection,
      response: selectedResponse,
      effectiveness: Math.round(effectiveness * 100),
    });
  }

  const successRate = objections.length > 0 ? (successCount / objections.length) * 100 : 100;

  return {
    count: objections.length,
    addressed,
    successRate: Math.round(successRate),
  };
}
