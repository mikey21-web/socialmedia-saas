"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function DashboardCard({ label, value, trend }: { label: string; value: string | number; trend?: string }) {
  const positive = !trend?.trim().startsWith("-");
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <section className="border-b border-r border-border bg-card p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold tracking-normal">{value}</div>
        {trend ? (
          <span className={positive ? "inline-flex items-center gap-1 text-xs text-emerald-700" : "inline-flex items-center gap-1 text-xs text-red-700"}>
            <Icon className="size-3" />
            {trend}
          </span>
        ) : null}
      </div>
    </section>
  );
}
