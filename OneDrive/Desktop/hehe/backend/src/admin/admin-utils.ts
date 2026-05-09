import { PrismaService } from '../prisma/prisma.service';

export type JsonRecord = Record<string, unknown>;

export function startOfDay(daysAgo = 0): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

export function startOfMonth(monthsAgo = 0): Date {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  date.setMonth(date.getMonth() - monthsAgo);
  return date;
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 10000) / 100;
}

export function planMonthlyValue(plan?: string | null): number {
  const values: Record<string, number> = { free: 0, starter: 19, pro: 49, growth: 99, business: 199, enterprise: 499 };
  return values[(plan ?? 'free').toLowerCase()] ?? 0;
}

export function stableRolloutBucket(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash % 100;
}

export async function getRecentApiStats(prisma: PrismaService, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const [total, errors, avg] = await Promise.all([
    prisma.db.apiUsageLog.count({ where: { createdAt: { gte: since } } }),
    prisma.db.apiUsageLog.count({ where: { createdAt: { gte: since }, statusCode: { gte: 500 } } }),
    prisma.db.apiUsageLog.aggregate({ where: { createdAt: { gte: since } }, _avg: { responseTimeMs: true } }),
  ]);

  return {
    total,
    errors,
    errorRate: percent(errors, total),
    avgLatencyMs: Math.round(Number(avg._avg.responseTimeMs ?? 0)),
  };
}
