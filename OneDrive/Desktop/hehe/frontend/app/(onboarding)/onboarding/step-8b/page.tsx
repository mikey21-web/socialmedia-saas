"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface VisualDirection {
  id: string;
  name: string;
  tagline: string;
  description: string;
  references: string[];
  mood: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    light: string;
    dark: string;
    background: string;
    foreground: string;
    muted: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
}

export default function VisualDirectionsStep() {
  const router = useRouter();
  const [directions, setDirections] = useState<VisualDirection[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    api.get<VisualDirection[]>("/brand-voice/directions")
      .then((r) => setDirections(r.data))
      .finally(() => setLoading(false));
  }, []);

  async function applyDirection() {
    if (!selected) return;
    setApplying(true);
    try {
      await api.post("/brand-voice/directions/apply", { directionId: selected });
      router.push("/onboarding/step-9");
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <ProgressBar currentStep={8} />
        <Card className="p-6 flex items-center justify-center min-h-[300px]">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={8} />
      <Card className="p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="size-5 text-violet-500" />
            Pick a visual direction
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            One click locks your palette + fonts + tone. Pick the direction that matches your audience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {directions.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelected(d.id)}
              className={cn(
                "text-left p-4 rounded-lg border-2 transition-all relative overflow-hidden group",
                selected === d.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-ring",
              )}
              style={{
                background: selected === d.id ? `${d.colors.background}15` : undefined,
              }}
            >
              {selected === d.id && (
                <div className="absolute top-2 right-2 size-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="size-3 text-primary-foreground" />
                </div>
              )}

              {/* Color preview */}
              <div className="flex gap-1 mb-3">
                {[d.colors.background, d.colors.primary, d.colors.accent, d.colors.secondary].map((c, i) => (
                  <div
                    key={i}
                    className="size-6 rounded border border-border/50"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <h3 className="font-semibold text-sm mb-1">{d.name}</h3>
              <p className="text-xs text-muted-foreground italic mb-2">{d.tagline}</p>
              <p className="text-xs text-muted-foreground line-clamp-3">{d.description}</p>

              {/* References */}
              <div className="mt-3 flex flex-wrap gap-1">
                {d.references.slice(0, 3).map((ref) => (
                  <span
                    key={ref}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {ref}
                  </span>
                ))}
              </div>

              {/* Mood */}
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                {d.mood.slice(0, 4).join(" · ")}
              </p>
            </button>
          ))}
        </div>

        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={() => router.push("/onboarding/step-8")}>
            Back
          </Button>
          <Button onClick={applyDirection} disabled={!selected || applying} className="gap-2">
            {applying && <Loader2 className="size-4 animate-spin" />}
            Apply & continue
          </Button>
        </div>
      </Card>
    </div>
  );
}
