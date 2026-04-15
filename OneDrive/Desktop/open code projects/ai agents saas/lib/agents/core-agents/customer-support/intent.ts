export async function analyzeIntent(message: string) {
  const lowerMsg = message.toLowerCase();
  let type: string;

  if (lowerMsg.includes('charge') || lowerMsg.includes('billing') || lowerMsg.includes('payment')) {
    type = 'billing';
  } else if (lowerMsg.includes('feature') || lowerMsg.includes('request')) {
    type = 'feature_request';
  } else if (lowerMsg.includes('issue') || lowerMsg.includes('problem') || lowerMsg.includes('not working')) {
    type = 'technical';
  } else if (lowerMsg.includes('complaint') || lowerMsg.includes('angry')) {
    type = 'complaint';
  } else {
    const intents = ['billing', 'technical', 'feature_request', 'complaint'];
    type = intents[Math.floor(Math.random() * intents.length)];
  }

  const urgency = lowerMsg.includes('urgent') ? 'high' : 'normal';
  return { type, urgency };
}
