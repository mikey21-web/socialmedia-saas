"use client";

import { useEffect, useState } from "react";
import { DollarSign, ExternalLink, MousePointerClick, TrendingUp, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";

interface RoiData {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
  revenuePerPost: number;
  topPerformingPosts: Array<{
    postId: string;
    title: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  byPlatform: Array<{
    platform: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
}

export default function RoiDashboard() {
  const [data, setData] = useState<RoiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    const from = new Date();
    from.setDate(from.getDate() - (dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90));

    api.get("/analytics/roi", { params: { from: from.toISOString() } })
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dateRange]);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading ROI data...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="size-6 text-green-500" />
            Revenue Attribution
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track which posts drive real business results
          </p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <MousePointerClick className="size-3" /> Clicks
            </div>
            <p className="text-2xl font-bold mt-1">{data?.totalClicks ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Target className="size-3" /> Conversions
            </div>
            <p className="text-2xl font-bold mt-1">{data?.totalConversions ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <DollarSign className="size-3" /> Revenue
            </div>
            <p className="text-2xl font-bold mt-1">₹{(data?.totalRevenue ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <TrendingUp className="size-3" /> Conv. Rate
            </div>
            <p className="text-2xl font-bold mt-1">{(data?.conversionRate ?? 0).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <DollarSign className="size-3" /> Rev/Post
            </div>
            <p className="text-2xl font-bold mt-1">₹{(data?.revenuePerPost ?? 0).toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Revenue Chart */}
      {data?.byPlatform && data.byPlatform.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenue by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.byPlatform}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#22c55e" name="Revenue (₹)" />
                <Bar dataKey="clicks" fill="#3b82f6" name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Posts */}
      {data?.topPerformingPosts && data.topPerformingPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Revenue-Driving Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topPerformingPosts.map((post, i) => (
                <div key={post.postId} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[300px]">{post.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {post.clicks} clicks → {post.conversions} conversions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-500">₹{post.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(!data || data.totalClicks === 0) && (
        <Card className="p-8 text-center">
          <ExternalLink className="size-8 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-medium">No ROI data yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Enable UTM tracking on your posts to start tracking revenue attribution.
          </p>
        </Card>
      )}
    </div>
  );
}
