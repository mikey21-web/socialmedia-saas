"use client";

import { type LucideIcon } from "lucide-react";
import { Card } from "./card";
import { type ReactNode } from "react";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4 inline-flex">{action}</div>}
    </Card>
  );
}
