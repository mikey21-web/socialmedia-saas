"use client";

import { Info } from "lucide-react";

interface WhyThisPostProps {
  generationContext: any;
}

export function WhyThisPost({ generationContext }: WhyThisPostProps) {
  if (!generationContext) return null;

  const { topic, angle, platform, compliance } = generationContext;

  return (
    <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
        <Info className="size-3" />
        Why this post?
      </div>
      {topic && <p><span className="text-muted-foreground">Topic:</span> {topic}</p>}
      {angle?.pillar && <p><span className="text-muted-foreground">Pillar:</span> {angle.pillar}</p>}
      {angle?.angle && <p><span className="text-muted-foreground">Angle:</span> {angle.angle}</p>}
      {angle?.brandFitScore != null && (
        <p><span className="text-muted-foreground">Brand fit:</span> {angle.brandFitScore}/10</p>
      )}
      {angle?.reasoning && <p className="text-muted-foreground italic">{angle.reasoning}</p>}
      {compliance && !compliance.passed && (
        <p className="text-amber-400">Compliance notes: {compliance.violations?.join(", ")}</p>
      )}
    </div>
  );
}
