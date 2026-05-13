'use client';

import { useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const { metrics, isLoading, fetchMetrics } = useDashboardStore();
  const [dateRange, setDateRange] = useState('7d');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setError(null);
    fetchMetrics(dateRange).catch((err: Error) => setError(err));
  }, [dateRange, fetchMetrics]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <LoadingState message="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <ErrorState
          title="Could not load analytics"
          message={error.message}
          onRetry={() => fetchMetrics(dateRange)}
        />
      </div>
    );
  }

  const hasData = metrics && (metrics.totalImpressions > 0 || metrics.totalEngagements > 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon={BarChart2}
          title="No analytics data yet"
          description="Once your posts go live, performance metrics will appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Impressions"
              value={metrics?.totalImpressions || 0}
              trend="+12%"
            />
            <MetricCard
              title="Total Engagements"
              value={metrics?.totalEngagements || 0}
              trend="+8%"
            />
            <MetricCard
              title="Avg Engagement Rate"
              value={(metrics?.averageEngagementRate || 0).toFixed(2) + '%'}
              trend="+3%"
            />
            <MetricCard
              title="Top Platform"
              value="Instagram"
              trend="45% of total"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.weeklyTrend && metrics.weeklyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#22c55e" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No trend data for this period</p>
              )}
            </CardContent>
          </Card>

          {metrics?.topPost && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Post</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {metrics.topPost.content.substring(0, 100)}...
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Impressions</p>
                    <p className="font-semibold">{metrics.topPost.metrics?.impressions || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Engagements</p>
                    <p className="font-semibold">{metrics.topPost.metrics?.engagements || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  trend,
}: {
  title: string;
  value: string | number;
  trend: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-2">{value}</p>
        <p className="text-xs text-emerald-500 mt-1">{trend}</p>
      </CardContent>
    </Card>
  );
}
