export const PLATFORM_BENCHMARKS: Record<string, {
  goodEngagementRate: number;
  avgEngagementRate: number;
  label: string;
}> = {
  instagram: { goodEngagementRate: 3.0, avgEngagementRate: 1.22, label: 'Instagram' },
  tiktok: { goodEngagementRate: 5.0, avgEngagementRate: 2.65, label: 'TikTok' },
  twitter: { goodEngagementRate: 1.0, avgEngagementRate: 0.37, label: 'X / Twitter' },
  linkedin: { goodEngagementRate: 2.0, avgEngagementRate: 0.54, label: 'LinkedIn' },
  facebook: { goodEngagementRate: 1.0, avgEngagementRate: 0.27, label: 'Facebook' },
  youtube: { goodEngagementRate: 4.0, avgEngagementRate: 1.8, label: 'YouTube' },
};
