export async function handleEscalation(urgency: string, solutionFound: boolean) {
  const needed = urgency === 'high' && !solutionFound;
  return { needed, tier: needed ? 2 : 1 };
}
