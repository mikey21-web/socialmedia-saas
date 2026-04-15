/**
 * Lead Analytics Agent
 * Tracks ROI and performance metrics for lead generation campaigns
 */

import type { Prospect } from './prospector';
import type { QualificationResult } from './qualifier';
import type { NurtureResult } from './nurture';

export interface ROIMetrics {
  roi: number;
  conversionRate: number;
  costPerLead: number;
  estimatedValue: number;
  metrics: {
    prospectCount: number;
    qualifiedCount: number;
    nurtureSentCount: number;
    conversionRate: number;
    avgEngagementScore: number;
    projectedMonthlyLeads: number;
  };
}

export async function trackROI(
  prospects: Prospect[],
  qualified: QualificationResult,
  nurtured: NurtureResult
): Promise<ROIMetrics> {
  const prospectCount = prospects.length;
  const qualifiedCount = qualified.count;
  const nurtureCount = nurtured.count;

  // Calculate conversion rate from prospects to qualified leads
  const conversionRate = prospectCount > 0 ? (qualifiedCount / prospectCount) * 100 : 0;

  // Estimate cost per lead (assuming $50 per lead based on outreach)
  const costPerLead = 50;

  // Calculate estimated value (assuming 10% conversion to customer at $5000 per customer)
  const estimatedConversionToCustomer = 0.1;
  const customerValue = 5000;
  const estimatedValue = qualifiedCount * estimatedConversionToCustomer * customerValue;

  // Calculate ROI percentage
  const totalCost = prospectCount * 10 + qualifiedCount * costPerLead; // prospecting + outreach
  const roi = totalCost > 0 ? ((estimatedValue - totalCost) / totalCost) * 100 : 0;

  // Project monthly leads based on this batch
  const projectedMonthlyLeads = qualifiedCount * 4; // Assume 4 batches per month

  // Calculate average engagement score from qualified leads
  const avgEngagementScore =
    qualified.leads.length > 0
      ? qualified.leads.reduce((sum, lead) => sum + lead.qualityScore, 0) / qualified.leads.length
      : 0;

  return {
    roi: Math.round(roi * 100) / 100,
    conversionRate: Math.round(conversionRate * 100) / 100,
    costPerLead,
    estimatedValue: Math.round(estimatedValue),
    metrics: {
      prospectCount,
      qualifiedCount,
      nurtureSentCount: nurtureCount,
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgEngagementScore: Math.round(avgEngagementScore * 100) / 100,
      projectedMonthlyLeads,
    },
  };
}
