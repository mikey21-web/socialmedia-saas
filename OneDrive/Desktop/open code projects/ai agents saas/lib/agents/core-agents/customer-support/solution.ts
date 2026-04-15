export async function findSolution(intentType: string) {
  const found = Math.random() > 0.3; // 70% resolution rate
  return { found, solution: found ? `Solution for ${intentType}` : null };
}
