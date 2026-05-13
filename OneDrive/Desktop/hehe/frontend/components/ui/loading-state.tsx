"use client";

import { Loader2 } from "lucide-react";
import { Card } from "./card";

export interface LoadingStateProps {
  message?: string;
  variant?: "card" | "inline" | "fullscreen";
}

export function LoadingState({ message = "Loading...", variant = "card" }: LoadingStateProps) {
  if (variant === "inline") {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>{message}</span>
      </div>
    );
  }

  if (variant === "fullscreen") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  return (
    <Card className="p-8 text-center">
      <Loader2 className="size-6 animate-spin mx-auto mb-3 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </Card>
  );
}

export function SkeletonRow({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}
