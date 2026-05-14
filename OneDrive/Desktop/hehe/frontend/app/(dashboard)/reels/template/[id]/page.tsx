"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Clock,
  Lightbulb,
  Loader2,
  Music,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

interface TemplateDetail {
  id: string;
  slug: string;
  title: string;
  category: string;
  vertical: string;
  goal: string;
  difficulty: string;
  estDurationSec: number;
  shotCount: number;
  shotList: Array<{
    index: number;
    durationSec: number;
    action: string;
    cameraAngle: string;
    lightingTip: string;
    propsNeeded: string[];
    textOverlay: string;
    voiceoverHint?: string;
  }>;
  structure: { hookSec: number; patternInterruptSec?: number; ctaSec: number; beats: string[] };
  captionTemplate: string;
  hashtagSets: Array<{ niche: string; tags: string[] }>;
  audioMood: string[];
  language: string;
  engagementTier: string;
  tags: string[];
}

export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledTopic = searchParams.get("topic") ?? "";

  const [tpl, setTpl] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState(prefilledTopic);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get(`/agency/reel-studio/templates/${id}`)
      .then(r => {
        setTpl(r.data);
        // Auto-detect variables from caption template like {{var}}
        const matches = (r.data.captionTemplate.match(/\{\{([^}]+)\}\}/g) ?? [])
          .map((m: string) => m.replace(/\{\{|\}\}/g, "").trim());
        const initial: Record<string, string> = {};
        for (const v of matches) initial[v] = "";
        setVariables(initial);
      })
      .catch(() => setTpl(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function generateScript() {
    if (!tpl || !topic.trim()) return;
    setGenerating(true);
    try {
      const r = await api.post("/agency/reel-studio/scripts/generate", {
        templateId: tpl.id,
        topic: topic.trim(),
        vertical: tpl.vertical,
        goal: tpl.goal,
        language: tpl.language,
        variables,
      });
      router.push(`/reels/scripts/${r.data.id}`);
    } catch {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tpl) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <p className="text-muted-foreground">Template not found.</p>
        <Link href="/reels" className="text-sm text-violet-500 mt-2 block">← Back to Reel Studio</Link>
      </div>
    );
  }

  const variableKeys = Object.keys(variables);

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Back */}
      <Link href="/reels" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to Reel Studio
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="capitalize">{tpl.category.replace(/_/g, " ")}</Badge>
          <Badge variant="outline" className="capitalize">{tpl.vertical}</Badge>
          <Badge variant="outline">{tpl.estDurationSec}s</Badge>
          <Badge variant="outline">{tpl.shotCount} shots</Badge>
          {tpl.engagementTier === "high" && (
            <Badge className="bg-green-500/15 text-green-400 border-green-500/30">🔥 High engagement</Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold">{tpl.title}</h1>
      </div>

      {/* Generate form — top of the page so users see it first */}
      <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wand2 className="size-4 text-violet-400" />
            Generate your script
          </CardTitle>
          <CardDescription>
            Tell us what to film. We'll write the hook, voiceover, captions, and hashtags using your brand voice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="topic" className="text-sm">What's this Reel about?</Label>
            <Input
              id="topic"
              placeholder='e.g. "balayage transformation on Priya"'
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {variableKeys.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {variableKeys.map((key) => (
                <div key={key}>
                  <Label htmlFor={`var-${key}`} className="text-xs capitalize">
                    {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                  </Label>
                  <Input
                    id={`var-${key}`}
                    value={variables[key]}
                    onChange={(e) => setVariables({ ...variables, [key]: e.target.value })}
                    placeholder={`{{${key}}}`}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={generateScript}
            disabled={!topic.trim() || generating}
            className="w-full sm:w-auto"
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Writing your script...
              </>
            ) : (
              <>
                <Sparkles className="size-4 mr-2" />
                Generate Full Script
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="size-4" />
            Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Hook</p>
              <p className="font-semibold">First {tpl.structure.hookSec}s</p>
            </div>
            {tpl.structure.patternInterruptSec && (
              <div>
                <p className="text-xs text-muted-foreground">Pattern interrupt</p>
                <p className="font-semibold">~{tpl.structure.patternInterruptSec}s</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">CTA</p>
              <p className="font-semibold">At {tpl.structure.ctaSec}s</p>
            </div>
          </div>
          {tpl.structure.beats?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-1.5">Beats</p>
              <div className="flex flex-wrap gap-1.5">
                {tpl.structure.beats.map((b, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {i + 1}. {b}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shot List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="size-4" />
            Shot list
          </CardTitle>
          <CardDescription>What to film, how to frame it, what props you need.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tpl.shotList.map((shot) => (
            <div key={shot.index} className="border-l-2 border-violet-500/30 pl-4 pb-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-[10px]">Shot {shot.index}</Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Clock className="size-2.5 mr-1" />
                  {shot.durationSec}s
                </Badge>
              </div>
              <p className="text-sm font-medium">{shot.action}</p>
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <p>📷 {shot.cameraAngle}</p>
                <p>💡 {shot.lightingTip}</p>
                {shot.propsNeeded.length > 0 && (
                  <p>🎁 Props: {shot.propsNeeded.join(", ")}</p>
                )}
                {shot.textOverlay && (
                  <p>✏️ Text overlay: <span className="text-foreground">"{shot.textOverlay}"</span></p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Audio mood */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Music className="size-4" />
            Audio mood
          </CardTitle>
          <CardDescription>
            Pick a trending Instagram audio matching these moods. We'll show recommendations after script is generated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {tpl.audioMood.map((m) => (
              <Badge key={m} variant="outline">{m}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filming tips */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <Lightbulb className="size-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1.5">
              <p className="font-semibold">Filming tips that always work:</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                <li>Daylight near a window beats any expensive light.</li>
                <li>Lock exposure: tap-and-hold on your subject before recording.</li>
                <li>Hold phone vertical at chest or eye level — never lower.</li>
                <li>Speak slightly louder and slower than normal conversation.</li>
                <li>Record 5-10 extra seconds at start/end for editing room.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
