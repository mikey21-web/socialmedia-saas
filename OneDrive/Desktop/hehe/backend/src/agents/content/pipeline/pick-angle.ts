import { Angle } from '../types';

function computeScore(angle: Angle): number {
  const brandFit = angle.brandFitScore ?? 5;
  const virality = angle.viralityScore ?? 5;
  const novelty = angle.noveltyScore ?? 5;
  const trendBonus = angle.trendAligned ? 1.5 : 0;
  const specificityBonus = angle.specificDetails?.length > 20 ? 1 : 0;

  // Virality matters most (40%), then novelty (25%), then brand fit (20%), bonuses (15%)
  return (virality * 0.40) + (novelty * 0.25) + (brandFit * 0.20) + trendBonus + specificityBonus;
}

export function pickBestAngle(angles: Angle[]): Angle {
  if (angles.length === 0) {
    throw new Error('No angles to pick from');
  }

  const scored = angles.map(a => ({ angle: a, score: computeScore(a) }));
  scored.sort((a, b) => b.score - a.score);

  return scored[0].angle;
}

export function rankAngles(angles: Angle[]): Angle[] {
  return [...angles]
    .map(a => ({ angle: a, score: computeScore(a) }))
    .sort((a, b) => b.score - a.score)
    .map(a => a.angle);
}
