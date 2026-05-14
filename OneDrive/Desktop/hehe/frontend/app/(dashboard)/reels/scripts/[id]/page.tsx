"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  Hash,
  Lightbulb,
  Loader2,
  MessageCircle,
  Music,
  Quote,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface Shot {
  index: number;
  durationSec: number;
  action: string;
  cameraAngle: string;
  lightingTip: string;
  propsNeeded: string[];
  textOverlay: string;
  voiceover?: string;
  voiceoverHint?: string;
}

interface ReelScript {
  id: string;
  title: string;
  topic: string;
  vertical: string;
  goal: string;
  language: string;
  hook: string;
  patternInterrupt: string | null;
  cta: string;
  caption: string;
  hashtags: string[];
  shots: Shot[];
  audioSuggestion: { mood: string[]; bpm?: number; trackIds: string[] };
  filmingTips: string[];
  totalDuration: number;
  status: string;
  videoProjectId?: string;
}

interface TrendingAudio {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  bpm?: number;
  trendStrength: number;
  previewUrl?: string;
}

export default function ScriptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [script, setScript] = useState<ReelScript | null>(null);
  const [audio, setAudio] = useState<TrendingAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/agency/reel-studio/scripts/${id}`)
      .then(async r => {
        setScript(r.data);
        // Fetch trending audio for these moods
        const moods = r.data.audioSuggestion?.mood ?? [];
        if (moods.length > 0) {
          try {
            const a = await api.get("/agency/reel-studio/audio", {
              params: { mood: moods[0], platform: "instagram", limit: 5 },
            });
            setAudio(a.data ?? []);
          } catch { /* ignore */ }
        }
      })
      .catch(() => setScript(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(newStatus: string) {
    if (!script) return;
    setUpdating(true);
    try {
      const r = await api.patch(`/agency/reel-studio/scripts/${id}/status`, { status: newStatus });
      setScript({ ...script, status: r.data.status });
    } finally {
      setUpdating(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <p className="text-muted-foreground">Script not found.</p>
        <Link href="/reels" className="text-sm text-violet-500 mt-2 block">← Back to Reel Studio</Link>
      </div>
    );
  }

  const fullCaption = `${script.caption}\n\n${script.hashtags.join(" ")}`;

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <Link href="/reels" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to Reel Studio
      </Link>

      {/* Header + status */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{script.totalDuration}s</Badge>
            <Badge variant="outline" className="capitalize">{script.vertical}</Badge>
            <Badge variant="outline" className="capitalize">{script.goal}</Badge>
            <Badge className={
              script.status === "published" ? "bg-green-500/15 text-green-400 border-green-500/30" :
              script.status === "ready" ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
              script.status === "filming" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
              "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
            }>
              {script.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{script.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Topic: {script.topic}</p>
        </div>
        <div className="flex gap-2">
          {script.status === "draft" && (
            <Button variant="outline" onClick={() => updateStatus("filming")} disabled={updating}>
              I'm filming
            </Button>
          )}
          {script.status === "filming" && (
            <Button variant="outline" onClick={() => updateStatus("ready")} disabled={updating}>
              Ready to publish
            </Button>
          )}
          {script.status === "ready" && (
            <Button onClick={() => updateStatus("published")} disabled={updating}>
              <CheckCircle2 className="size-4 mr-1.5" />
              Mark published
            </Button>
          )}
        </div>
      </div>

      {/* Hook + CTA — quick read */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="size-4 text-violet-400" />
              Hook (first 1.5s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-medium leading-snug">"{script.hook}"</p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 h-7"
              onClick={() => copyToClipboard(script.hook, "hook")}
            >
              <Copy className="size-3 mr-1" />
              {copied === "hook" ? "Copied!" : "Copy hook"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageCircle className="size-4 text-fuchsia-400" />
              CTA (last 2s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-medium leading-snug">"{script.cta}"</p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 h-7"
              onClick={() => copyToClipboard(script.cta, "cta")}
            >
              <Copy className="size-3 mr-1" />
              {copied === "cta" ? "Copied!" : "Copy CTA"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Shots */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="size-4" />
            Shot-by-shot script
          </CardTitle>
          <CardDescription>What to film, what to say, what to put on screen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {script.shots.map((shot) => (
            <div key={shot.index} className="border-l-2 border-violet-500/30 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">Shot {shot.index}</Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Clock className="size-2.5 mr-1" />
                  {shot.durationSec}s
                </Badge>
              </div>

              <p className="text-sm font-medium mb-2">{shot.action}</p>

              {shot.voiceover && (
                <div className="bg-violet-500/5 border border-violet-500/20 rounded p-3 mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-violet-400 mb-1">
                    <Volume2 className="size-3" />
                    Voiceover (what you SAY)
                  </div>
                  <p className="text-sm">"{shot.voiceover}"</p>
                </div>
              )}

              {shot.textOverlay && (
                <div className="bg-fuchsia-500/5 border border-fuchsia-500/20 rounded p-3 mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-fuchsia-400 mb-1">
                    <Quote className="size-3" />
                    Text on screen
                  </div>
                  <p className="text-sm font-medium">"{shot.textOverlay}"</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>📷 {shot.cameraAngle}</p>
                <p>💡 {shot.lightingTip}</p>
                {shot.propsNeeded?.length > 0 && (
                  <p>🎁 Props: {shot.propsNeeded.join(", ")}</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Caption */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="size-4" />
            Caption + hashtags
          </CardTitle>
          <CardDescription>Copy and paste into Instagram when uploading.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted/50 border border-border rounded p-4 text-sm whitespace-pre-wrap font-sans">
{fullCaption}
          </pre>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => copyToClipboard(fullCaption, "caption")}
          >
            <Copy className="size-3.5 mr-1.5" />
            {copied === "caption" ? "Copied!" : "Copy caption + hashtags"}
          </Button>
          <div className="flex flex-wrap gap-1 mt-3">
            {script.hashtags.map((h) => (
              <Badge key={h} variant="outline" className="text-xs">
                <Hash className="size-2.5 mr-0.5" />
                {h.replace("#", "")}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audio recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Music className="size-4" />
            Trending audio that matches
          </CardTitle>
          <CardDescription>
            Search for these in Instagram when uploading. {script.audioSuggestion?.mood?.length > 0 && (
              <>Mood: {script.audioSuggestion.mood.join(", ")}.</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {audio.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No specific audio matches yet. Use any trending audio with{" "}
              {script.audioSuggestion?.mood?.join(" / ") ?? "this mood"} feel.
            </p>
          ) : (
            <div className="space-y-2">
              {audio.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-2.5 rounded border border-border/50">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.artist && <p className="text-xs text-muted-foreground">{a.artist}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {a.bpm && <span>{a.bpm} bpm</span>}
                    <span>{Math.round(a.duration)}s</span>
                    <Badge variant="outline" className="text-[10px]">
                      🔥 {a.trendStrength}/10
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filming tips */}
      {script.filmingTips?.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <Lightbulb className="size-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm space-y-1.5">
                <p className="font-semibold">Filming tips for THIS Reel:</p>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                  {script.filmingTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next step */}
      <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
        <CardContent className="pt-5 pb-5">
          <h3 className="font-semibold mb-1">After filming</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Upload your raw video — we'll auto-format it for 9:16 (Reels), 16:9 (LinkedIn), 1:1 (X) and add captions.
          </p>
          <Link href="/video">
            <Button>
              Upload video for auto-formatting
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
