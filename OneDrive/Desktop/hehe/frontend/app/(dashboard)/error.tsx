"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center px-4">
      <AlertCircle className="size-8 text-destructive" />
      <p className="text-sm font-medium">Failed to load</p>
      <p className="text-xs text-muted-foreground">{error.message}</p>
      <Button size="sm" variant="outline" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
