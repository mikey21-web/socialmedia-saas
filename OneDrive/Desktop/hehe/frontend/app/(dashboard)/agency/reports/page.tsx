"use client";

import { useEffect, useState } from "react";
import { BarChart2, Loader2, TrendingUp, TrendingDown, Lightbulb, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface WeeklyReport {
  summary: string;
  topPosts: { postId: string; title: string; impressions: number; engagements: number }[];
  underperformers: { postId: string; title: string; impressions: number }[];
  insights: string[];
  recommendations: string[];
  followerGrowth: Record<string, number>;
  engagementRate: Record<string, number>;
}

export default function ReportsPage() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    setLoading(true);
    try {
      const r = await api.get("/api/agency/analyst/weekly-report");
      setReport(r.data);
    } catch {
      // no report available
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <BarChart2 className="size-6 text-orange-500" />
          Performance Reports
        </h1>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No report data available yet. Publish some content first.</p>
          <Button onClick={loadReport}>Generate Report</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart2 className="size-6 text-orange-500" />
            Weekly Performance Report
          </h1>
          <p className="text-muted-foreground text-sm mt-1">AI-generated insights from your content performance</p>
        </div>
        <Button variant="outline" onClick={loadReport} className="gap-2">
          <Loader2 className="size-4" /> Refresh
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm leading-relaxed">{report.summary}</p>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(report.followerGrowth).map(([platform, growth]) => (
          <Card key={platform}>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground capitalize">{platform}</p>
              <p className="text-2xl font-bold flex items-center justify-center gap-1">
                {growth >= 0 ? <TrendingUp className="size-4 text-green-500" /> : <TrendingDown className="size-4 text-red-500" />}
                {growth >= 0 ? "+" : ""}{growth}
              </p>
              <p className="text-[10px] text-muted-foreground">followers</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(report.engagementRate).map(([platform, rate]) => (
          <Card key={platform}>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground capitalize">{platform}</p>
              <p className="text-2xl font-bold">{rate}%</p>
              <p className="text-[10px] text-muted-foreground">engagement rate</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="size-4 text-green-500" /> Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {report.topPosts.map((p, i) => (
              <div key={p.postId} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                  <p className="text-sm">{p.title}</p>
                </div>
                <Badge variant="secondary">{p.impressions.toLocaleString()} imp</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Underperformers */}
      {report.underperformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="size-4 text-red-500" /> Underperformers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.underperformers.map((p) => (
                <div key={p.postId} className="flex items-center justify-between rounded-md border p-3">
                  <p className="text-sm">{p.title}</p>
                  <Badge variant="outline">{p.impressions.toLocaleString()} imp</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="size-4 text-yellow-500" /> Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {report.insights.map((i, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <span className="text-muted-foreground">•</span> {i}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="size-4 text-blue-500" /> Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {report.recommendations.map((r, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <span className="text-blue-500">→</span> {r}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
