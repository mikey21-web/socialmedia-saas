"use client";

import { useEffect, useState } from "react";
import { Loader2, Play, Sparkles, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface HyperframeField {
  key: string;
  label: string;
  type: "text" | "longtext" | "color" | "number" | "image_url";
  required?: boolean;
  placeholder?: string;
  default?: string | number;
}

interface HyperframeTemplate {
  id: string;
  name: string;
  category: "product" | "social" | "data" | "brand" | "utility" | "lifestyle";
  description: string;
  durationSec: number;
  recommendedFormat: "story" | "square" | "landscape";
  fields: HyperframeField[];
  attribution?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  product: "bg-blue-500/15 text-blue-500 border-blue-500/25",
  social: "bg-pink-500/15 text-pink-500 border-pink-500/25",
  data: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
  brand: "bg-purple-500/15 text-purple-500 border-purple-500/25",
  utility: "bg-amber-500/15 text-amber-500 border-amber-500/25",
  lifestyle: "bg-rose-500/15 text-rose-500 border-rose-500/25",
};

export default function HyperframesPage() {
  const [templates, setTemplates] = useState<HyperframeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selected, setSelected] = useState<HyperframeTemplate | null>(null);
  const [data, setData] = useState<Record<string, string | number>>({});
  const [rendering, setRendering] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    api.get<HyperframeTemplate[]>("/api/media/hyperframes/templates")
      .then((r) => setTemplates(r.data))
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error("Failed to load templates")))
      .finally(() => setLoading(false));
  }, []);

  function selectTemplate(tpl: HyperframeTemplate) {
    setSelected(tpl);
    setResultUrl(null);
    const defaults: Record<string, string | number> = {};
    tpl.fields.forEach((f) => {
      if (f.default !== undefined) defaults[f.key] = f.default;
    });
    setData(defaults);
  }

  async function render() {
    if (!selected) return;
    setRendering(true);
    setResultUrl(null);
    try {
      const res = await api.post<{ url: string }>(
        "/api/media/hyperframes/render-extended",
        {
          templateId: selected.id,
          data,
          format: selected.recommendedFormat,
        },
      );
      setResultUrl(res.data.url);
    } finally {
      setRendering(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-semibold">Animated Templates</h1>
        <LoadingState message="Loading templates..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-semibold">Animated Templates</h1>
        <ErrorState title="Failed to load" message={error.message} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const grouped = templates.reduce<Record<string, HyperframeTemplate[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="size-6 text-purple-500" />
            Animated Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {templates.length} HTML→MP4 templates. Pick one, fill the fields, get a 3-30s branded video.
          </p>
        </div>
      </div>

      {!selected ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {category} ({items.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((tpl) => (
                  <Card
                    key={tpl.id}
                    className="cursor-pointer hover:border-ring transition-colors"
                    onClick={() => selectTemplate(tpl)}
                  >
                    <CardContent className="pt-4 pb-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{tpl.name}</p>
                        <Badge className={cn("text-[10px] border", CATEGORY_COLORS[tpl.category])}>
                          {tpl.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {tpl.durationSec}s
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {tpl.recommendedFormat}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">{selected.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Back
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {selected.fields.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    {f.label}
                    {f.required && <span className="text-destructive">*</span>}
                  </Label>
                  {f.type === "longtext" ? (
                    <textarea
                      value={String(data[f.key] ?? "")}
                      onChange={(e) => setData((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full min-h-[80px] p-2 text-sm rounded-md border border-input bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : f.type === "color" ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={String(data[f.key] ?? f.default ?? "#6366f1")}
                        onChange={(e) => setData((p) => ({ ...p, [f.key]: e.target.value }))}
                        className="size-9 rounded border border-input cursor-pointer"
                      />
                      <Input
                        value={String(data[f.key] ?? "")}
                        onChange={(e) => setData((p) => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={String(f.default ?? "#6366f1")}
                      />
                    </div>
                  ) : (
                    <Input
                      type={f.type === "number" ? "number" : "text"}
                      value={String(data[f.key] ?? "")}
                      onChange={(e) => setData((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                    />
                  )}
                </div>
              ))}

              <Button
                onClick={render}
                disabled={rendering}
                className="w-full gap-2 mt-3"
              >
                {rendering ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {rendering ? `Rendering ${selected.durationSec}s video…` : "Render Video"}
              </Button>

              {selected.attribution && (
                <p className="text-[10px] text-muted-foreground italic pt-2">
                  {selected.attribution}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {resultUrl ? (
                <div className="space-y-3">
                  <video
                    src={resultUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full rounded-lg bg-black"
                  />
                  <a
                    href={resultUrl}
                    download
                    className="block w-full text-center px-4 py-2 text-sm rounded-md border border-input bg-background hover:bg-muted transition-colors"
                  >
                    Download MP4
                  </a>
                </div>
              ) : rendering ? (
                <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Rendering animation frames...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Takes about {Math.round(selected.durationSec * 2)}s
                    </p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video border border-dashed rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground text-sm">
                    <Play className="size-8 mx-auto opacity-30 mb-2" />
                    <p>Fill the fields and click Render to preview</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
