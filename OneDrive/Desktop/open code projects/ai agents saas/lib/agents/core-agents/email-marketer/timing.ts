export async function optimizeTiming(segments: string[]) {
  const hours = [9, 14, 18];
  const optimalTime = `${hours[Math.floor(Math.random() * hours.length)]}:00`;
  return { optimalTime };
}
