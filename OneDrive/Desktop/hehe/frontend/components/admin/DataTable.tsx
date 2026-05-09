"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

export function DataTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  const [query, setQuery] = useState("");
  const columns = useMemo(() => Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).slice(0, 7), [rows]);
  const visible = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())).slice(0, 25);
  return (
    <div className="border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <Search className="size-4 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rows" className="h-8 border-0 shadow-none focus-visible:ring-0" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>{columns.map((column) => <th key={column} className="px-3 py-2 font-medium">{column}</th>)}</tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr key={String(row.id ?? index)} className="border-t border-border">
                {columns.map((column) => <td key={column} className="max-w-[240px] truncate px-3 py-2">{formatCell(row[column])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCell(value: unknown) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
