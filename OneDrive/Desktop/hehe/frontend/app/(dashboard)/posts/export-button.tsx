"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAnalyticsStore } from "@/store/analytics";

interface ExportButtonProps {
  type: "posts" | "trends";
  className?: string;
}

export function ExportButton({ type, className }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const from = useAnalyticsStore((s) => s.from);
  const to = useAnalyticsStore((s) => s.to);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type });
      if (from) params.set("startDate", from);
      if (to) params.set("endDate", to);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/analytics/export?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${(() => {
              try {
                const raw = localStorage.getItem("auth");
                if (raw) {
                  const parsed = JSON.parse(raw) as { state?: { token?: string } };
                  return parsed?.state?.token ?? "";
                }
              } catch {}
              return "";
            })()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `${type}-export-${new Date().toISOString().split("T")[0]}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={exporting}
        className="gap-1.5"
      >
        {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
        Export CSV
      </Button>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
