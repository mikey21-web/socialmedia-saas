"use client";

import { Activity, Database, Flag, KeyRound, LifeBuoy, Mail, RefreshCcw, Send, Server, Shield, Timer, Users, Webhook } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/admin/DashboardCard";
import { DataTable } from "@/components/admin/DataTable";
import { LineChart } from "@/components/admin/LineChart";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminMutations } from "@/hooks/useAdminMutations";

const configs = {
  overview: { title: "Command Center", path: "/admin/analytics/overview", icon: Activity },
  analytics: { title: "Analytics", path: "/admin/analytics/overview", icon: Activity },
  health: { title: "System Health", path: "/admin/health/status", icon: Server },
  "feature-flags": { title: "Feature Flags", path: "/admin/feature-flags", icon: Flag },
  "api-usage": { title: "API Usage", path: "/admin/api-usage/top-endpoints", icon: Timer },
  webhooks: { title: "Webhooks", path: "/admin/webhooks", icon: Webhook },
  audit: { title: "Audit Trail", path: "/admin/audit", icon: Shield },
  security: { title: "Security", path: "/admin/teams", icon: KeyRound },
  "email-templates": { title: "Email Templates", path: "/admin/email-templates", icon: Mail },
  support: { title: "Support Tickets", path: "/admin/support/tickets", icon: LifeBuoy },
  teams: { title: "Teams", path: "/admin/teams", icon: Users },
  backups: { title: "Backups", path: "/admin/backups", icon: Database },
  performance: { title: "Performance", path: "/admin/performance/db-queries", icon: Timer },
} as const;

type Section = keyof typeof configs;

export function AdminSectionPage({ section }: { section: Section }) {
  const config = configs[section];
  const { data, loading, error } = useAdmin<unknown>(config.path, section === "overview" || section === "analytics" || section === "health" ? {} : []);
  const mutations = useAdminMutations();
  const rows = useMemo(() => normalizeRows(data), [data]);
  const Icon = config.icon;
  const metrics = getMetrics(section, data);

  return (
    <main className="min-h-dvh bg-background">
      <section className="border-b border-border px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center border border-border bg-card"><Icon className="size-4" /></div>
            <div>
              <h1 className="text-xl font-semibold tracking-normal">{config.title}</h1>
              <p className="text-sm text-muted-foreground">Operational controls and live SaaS observability.</p>
            </div>
          </div>
          <div className="flex gap-2">
            {section === "audit" ? <Button variant="outline" onClick={() => mutations.action("/admin/audit/export")}>Export CSV</Button> : null}
            {section === "backups" ? <Button onClick={() => mutations.action("/admin/backups/manual")}><RefreshCcw className="size-4" /> Trigger</Button> : null}
            {section === "webhooks" && rows[0]?.id ? <Button onClick={() => mutations.action(`/admin/webhooks/${rows[0].id}/test`)}><Send className="size-4" /> Test first</Button> : null}
          </div>
        </div>
      </section>

      <section className="grid border-b border-border sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => <DashboardCard key={metric.label} label={metric.label} value={metric.value} trend={metric.trend} />)}
      </section>

      <section className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {section === "analytics" || section === "overview" || section === "performance" ? <LineChart data={chartData(data)} /> : null}
          {loading ? <div className="border border-border p-6 text-sm text-muted-foreground">Loading admin data...</div> : <DataTable rows={rows} />}
          {error ? <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        </div>
        <aside className="border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Control Surface</h2>
          <div className="mt-4 space-y-3 text-sm">
            <ControlRow label="Guard" value={<StatusBadge status="admin-only" />} />
            <ControlRow label="Records" value={rows.length} />
            <ControlRow label="Endpoint" value={config.path} />
            <ControlRow label="Mode" value="live API" />
          </div>
        </aside>
      </section>
    </main>
  );
}

function ControlRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 border-b border-border pb-2"><span className="text-muted-foreground">{label}</span><span className="truncate text-right">{value}</span></div>;
}

function normalizeRows(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  if (Array.isArray(record.backups)) return record.backups as Array<Record<string, unknown>>;
  if (Array.isArray(record.platformBreakdown)) return record.platformBreakdown as Array<Record<string, unknown>>;
  if (Array.isArray(record.topCustomers)) return record.topCustomers as Array<Record<string, unknown>>;
  return Object.entries(record).map(([key, value]) => ({ metric: key, value }));
}

function getMetrics(section: Section, data: unknown) {
  const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const revenue = (record.revenue && typeof record.revenue === "object" ? record.revenue : {}) as Record<string, unknown>;
  return [
    { label: "DAU", value: String(record.dau ?? record.active ?? "0"), trend: "+ live" },
    { label: section === "health" ? "Error rate" : "MRR", value: section === "health" ? `${((record.api as Record<string, unknown> | undefined)?.errorRate ?? 0)}%` : `$${revenue.mrr ?? 0}` },
    { label: "Records", value: normalizeRows(data).length },
    { label: "Status", value: section === "health" ? String((record.database as Record<string, unknown> | undefined)?.status ?? "unknown") : "ready" },
  ];
}

function chartData(data: unknown) {
  const rows = normalizeRows(data).slice(0, 8);
  if (!rows.length) return Array.from({ length: 8 }, (_, index) => ({ label: `D${index + 1}`, value: Math.round(20 + Math.sin(index) * 10 + index * 4) }));
  return rows.map((row, index) => ({ label: String(row.platform ?? row.metric ?? `R${index + 1}`), value: Number(row.published ?? row.total ?? row.value ?? index + 1) || index + 1 }));
}
