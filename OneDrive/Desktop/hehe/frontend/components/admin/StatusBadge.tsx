"use client";

export function StatusBadge({ status }: { status?: string | boolean }) {
  const normalized = String(status ?? "unknown").toLowerCase();
  const tone = normalized === "ok" || normalized === "active" || normalized === "success" || normalized === "true"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : normalized === "degraded" || normalized === "pending" || normalized === "trialing"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-red-50 text-red-700 ring-red-200";
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ${tone}`}>{normalized}</span>;
}
