export async function scheduleFollowup(intent: string, escalated: boolean) {
  const scheduled = escalated || intent === 'feature_request';
  const days = scheduled ? Math.floor(Math.random() * 7) + 1 : 0;
  return { scheduled, daysUntilFollowup: days };
}
