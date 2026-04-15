import { TrackingResult } from './tracking';

export interface ForecastResult {
  forecastedRevenue: number;
  confidence: number;
  trend: string;
}

export const forecastRevenue = async (tracking: TrackingResult): Promise<ForecastResult> => {
  return {
    forecastedRevenue: 250000,
    confidence: 0.87,
    trend: 'Upward',
  };
};
