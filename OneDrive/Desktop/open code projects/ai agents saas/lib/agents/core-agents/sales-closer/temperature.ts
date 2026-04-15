/**
 * Temperature Analysis Sub-Agent
 * Analyzes conversation sentiment, buyer signals, and deal likelihood
 */

interface TemperatureAnalysis {
  score: number;
  objections: string[];
  signals: string[];
  readiness: 'cold' | 'warm' | 'hot';
}

export async function analyzeTemperature(conversation: string): Promise<TemperatureAnalysis> {
  // Simulate NLP analysis of buyer signals
  const conversationLower = conversation.toLowerCase();

  // Check for buying signals
  const positiveSignals = [
    { keyword: 'interested', weight: 20 },
    { keyword: 'ready', weight: 25 },
    { keyword: 'sign', weight: 30 },
    { keyword: 'proceed', weight: 25 },
    { keyword: 'premium', weight: 15 },
  ];

  const negativeSignals = [
    { keyword: 'expensive', weight: -20 },
    { keyword: 'expensive', weight: -15 },
    { keyword: 'budget', weight: -10 },
    { keyword: 'later', weight: -15 },
    { keyword: 'think', weight: -5 },
  ];

  let baseScore = 50;
  const signals: string[] = [];

  // Analyze positive signals
  for (const signal of positiveSignals) {
    if (conversationLower.includes(signal.keyword)) {
      baseScore += signal.weight;
      signals.push(`positive: ${signal.keyword}`);
    }
  }

  // Analyze negative signals
  for (const signal of negativeSignals) {
    if (conversationLower.includes(signal.keyword)) {
      baseScore += signal.weight;
      signals.push(`concern: ${signal.keyword}`);
    }
  }

  // Add randomness to simulate real variation
  const score = Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * 20));

  // Determine objections based on score
  const objections: string[] = [];
  if (score < 40) {
    objections.push('price', 'timing', 'budget');
  } else if (score < 70) {
    objections.push('budget', 'implementation');
  } else {
    objections.push('contract_terms');
  }

  // Determine readiness
  let readiness: 'cold' | 'warm' | 'hot';
  if (score < 40) readiness = 'cold';
  else if (score < 70) readiness = 'warm';
  else readiness = 'hot';

  return {
    score: Math.round(score),
    objections,
    signals,
    readiness,
  };
}
