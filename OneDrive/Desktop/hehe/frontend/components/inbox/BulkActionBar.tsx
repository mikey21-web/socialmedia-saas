"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  selectedCount: number;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onClear: () => void;
}

export function BulkActionBar({ selectedCount, onApproveAll, onRejectAll, onClear }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="flex-1" />
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onApproveAll}>
        <Check className="size-3" /> Approve All
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={onRejectAll}>
        <X className="size-3" /> Reject All
      </Button>
      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
