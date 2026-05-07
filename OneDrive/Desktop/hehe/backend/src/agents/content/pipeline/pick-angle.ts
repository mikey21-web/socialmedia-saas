import { Angle } from '../types';

export function pickBestAngle(angles: Angle[]): Angle {
  if (angles.length === 0) {
    throw new Error('No angles to pick from');
  }

  const sorted = [...angles].sort(
    (a, b) => (b.brandFitScore ?? 0) - (a.brandFitScore ?? 0),
  );

  return sorted[0];
}
