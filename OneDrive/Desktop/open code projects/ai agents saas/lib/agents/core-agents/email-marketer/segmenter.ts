export async function segmentAudience(topic: string) {
  const count = Math.floor(Math.random() * 5) + 3;
  return { count, segments: Array(count).fill(0).map((_, i) => `segment-${i}`) };
}
