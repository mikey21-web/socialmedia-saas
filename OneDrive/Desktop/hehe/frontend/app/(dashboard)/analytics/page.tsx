'use client';

import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const { metrics, isLoading, fetchMetrics } = useDashboardStore();
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchMetrics(dateRange);
  }, [dateRange, fetchMetrics]);

  return (
    <div className="space-y-6 p-6 bg-gray-950 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              onClick={() => setDateRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Metrics Overview */}
          <div className="grid grid-cols-4 gap-4">
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

          {/* Trend Chart */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Weekly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.weeklyTrend && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#00ff88"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Post */}
          {metrics?.topPost && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Top Performing Post</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-2">
                  {metrics.topPost.content.substring(0, 100)}...
                </p>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Impressions</p>
                    <p className="font-semibold">
                      {metrics.topPost.metrics?.impressions || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Engagements</p>
                    <p className="font-semibold">
                      {metrics.topPost.metrics?.engagements || 0}
                    </p>
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
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="pt-6">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-2">{value}</p>
        <p className="text-xs text-green-400 mt-1">{trend}</p>
      </CardContent>
    </Card>
  );
}
