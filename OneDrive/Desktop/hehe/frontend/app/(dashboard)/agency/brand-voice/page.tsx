"use client";

import { useEffect, useState } from "react";
import { Loader2, Mic2, Plus, RefreshCw, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

interface BrandVoice {
  id: string;
  name: string;
  description: string | null;
  toneAttributes: { formality: number; energy: number; humor: number; professionalism: number };
  vocabulary: string[];
  avoidPhrases: string[];
  emojiUsage: string;
  sentenceStyle: string;
  isActive: boolean;
  createdAt: string;
}

export default function BrandVoicePage() {
  const [voices, setVoices] = useState<BrandVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrainForm, setShowTrainForm] = useState(false);
  const [trainForm, setTrainForm] = useState({ brandName: "", brandDescription: "", postsText: "" });
  const [training, setTraining] = useState(false);
  const [sampleContent, setSampleContent] = useState("");
  const [scoreResult, setScoreResult] = useState<{ score: number; feedback: string[] } | null>(null);
  const [scoring, setScoring] = useState(false);

  useEffect(() => {
    loadVoices();
  }, []);

  async function loadVoices() {
    try {
      const r = await api.get("/api/agency/brand-voice");
      setVoices(r.data);
    } finally {
      setLoading(false);
    }
  }

  async function train() {
    setTraining(true);
    try {
      const posts = trainForm.postsText
        .split("\n---\n")
        .filter(Boolean)
        .map((content, i) => ({ platform: "instagram", content: content.trim(), engagement: 100 - i }));

      await api.post("/api/agency/brand-voice/train", {
        brandName: trainForm.brandName,
        brandDescription: trainForm.brandDescription,
        posts,
      });
      await loadVoices();
      setShowTrainForm(false);
      setTrainForm({ brandName: "", brandDescription: "", postsText: "" });
    } finally {
      setTraining(false);
    }
  }

  async function scoreMatch(voiceId: string) {
    if (!sampleContent.trim()) return;
    setScoring(true);
    try {
      const r = await api.post("/api/agency/brand-voice/score", {
        brandVoiceId: voiceId,
        content: sampleContent,
      });
      setScoreResult(r.data);
    } finally {
      setScoring(false);
    }
  }

  async function refine(voiceId: string) {
    await api.post(`/api/agency/brand-voice/refine/${voiceId}`);
    await loadVoices();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mic2 className="size-6 text-violet-500" />
            Brand Voice
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Train and manage your AI brand voice profiles</p>
        </div>
        <Button onClick={() => setShowTrainForm(true)} className="gap-2">
          <Plus className="size-4" /> Train New Voice
        </Button>
      </div>

      {showTrainForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Train from Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Brand Name</Label>
                <Input value={trainForm.brandName} onChange={(e) => setTrainForm({ ...trainForm, brandName: e.target.value })} placeholder="Your Brand" />
              </div>
              <div>
                <Label>Brand Description</Label>
                <Input value={trainForm.brandDescription} onChange={(e) => setTrainForm({ ...trainForm, brandDescription: e.target.value })} placeholder="What your brand does" />
              </div>
            </div>
            <div>
              <Label>Past Posts (separate with ---)</Label>
              <Textarea rows={8} value={trainForm.postsText} onChange={(e) => setTrainForm({ ...trainForm, postsText: e.target.value })} placeholder={"Post 1 content here...\n---\nPost 2 content here...\n---\nPost 3 content here..."} />
            </div>
            <div className="flex gap-2">
              <Button onClick={train} disabled={training || !trainForm.brandName} className="gap-2">
                {training && <Loader2 className="size-4 animate-spin" />} Train Voice
              </Button>
              <Button variant="ghost" onClick={() => setShowTrainForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {voices.map((v) => (
        <Card key={v.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{v.name}</CardTitle>
              {v.description && <p className="text-xs text-muted-foreground">{v.description}</p>}
            </div>
            <div className="flex gap-2">
              <Badge variant={v.isActive ? "default" : "secondary"}>{v.isActive ? "Active" : "Inactive"}</Badge>
              <Button variant="ghost" size="sm" onClick={() => refine(v.id)} className="gap-1">
                <RefreshCw className="size-3" /> Refine
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["formality", "energy", "humor", "professionalism"] as const).map((attr) => (
                <div key={attr}>
                  <Label className="text-xs capitalize">{attr}: {v.toneAttributes[attr]}/10</Label>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(v.toneAttributes[attr] / 10) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Emoji:</span>{" "}
                <Badge variant="outline">{v.emojiUsage}</Badge>
              </div>
              <div>
                <span className="font-medium">Style:</span>{" "}
                <Badge variant="outline">{v.sentenceStyle}</Badge>
              </div>
            </div>
            {v.vocabulary.length > 0 && (
              <div>
                <Label className="text-xs">Vocabulary</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {v.vocabulary.slice(0, 10).map((w) => (
                    <Badge key={w} variant="secondary" className="text-xs">{w}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Score test */}
            <div className="border-t pt-3 space-y-2">
              <Label className="text-xs">Test Voice Match</Label>
              <div className="flex gap-2">
                <Input value={sampleContent} onChange={(e) => setSampleContent(e.target.value)} placeholder="Paste draft content to score..." className="flex-1" />
                <Button variant="outline" size="sm" onClick={() => scoreMatch(v.id)} disabled={scoring} className="gap-1">
                  {scoring ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />} Score
                </Button>
              </div>
              {scoreResult && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <span className="font-semibold">Score: {scoreResult.score}/100</span>
                  <ul className="mt-1 text-xs text-muted-foreground space-y-1">
                    {scoreResult.feedback.map((f, i) => <li key={i}>• {f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {voices.length === 0 && !showTrainForm && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No brand voices trained yet. Click &quot;Train New Voice&quot; to get started.</p>
        </Card>
      )}
    </div>
  );
}
