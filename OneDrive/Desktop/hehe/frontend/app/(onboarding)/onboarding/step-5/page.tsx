"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { CompetitorsBuilder, type CompetitorEntry } from "@/components/onboarding/CompetitorsBuilder";
import { VoiceExamplesPaste, type VoiceExampleEntry } from "@/components/onboarding/VoiceExamplesPaste";
import { useBrandStore } from "@/store/brand";
import { api } from "@/lib/api";
import { Sparkles, CheckCircle2 } from "lucide-react";

export default function Step5() {
  const router = useRouter();
  const profile = useBrandStore((s) => s.profile);
  const completeOnboarding = useBrandStore((s) => s.completeOnboarding);
  const fetchProfile = useBrandStore((s) => s.fetchProfile);

  const [competitors, setCompetitors] = useState<CompetitorEntry[]>([]);
  const [voiceExamples, setVoiceExamples] = useState<VoiceExampleEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleFinish = async () => {
    setSaving(true);
    try {
      for (const comp of competitors) {
        await api.post("/brand/competitors", { name: comp.name, handles: comp.handles });
      }
      for (const ex of voiceExamples) {
        await api.post("/brand/voice-examples", { content: ex.content, platform: ex.platform });
      }
      await completeOnboarding();
      router.push("/dashboard");
    } finally { setSaving(false); }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      await completeOnboarding();
      router.push("/dashboard");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={5} />

      {!showPreview ? (
        <Card className="p-6 space-y-5">
          <div>
            <h1 className="text-lg font-semibold">Competition & past content</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Help our AI learn from what works in your space.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Competitors</Label>
              <p className="text-xs text-muted-foreground">Add 3-10 competitors with their social handles.</p>
              <CompetitorsBuilder value={competitors} onChange={setCompetitors} />
            </div>

            <div className="space-y-1.5">
              <Label>Voice Examples</Label>
              <p className="text-xs text-muted-foreground">Paste 5-10 of your top-performing posts so our AI can match your style.</p>
              <VoiceExamplesPaste value={voiceExamples} onChange={setVoiceExamples} />
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/onboarding/step-4")}>Back</Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip} disabled={saving}>Skip for now</Button>
              <Button onClick={() => setShowPreview(true)}>
                <Sparkles className="size-4 mr-1.5" /> Preview Brand
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Looks great!</h1>
              <p className="text-sm text-muted-foreground">Here&apos;s your brand identity summary.</p>
            </div>
          </div>

          {profile && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Brand</p>
                  <p className="font-medium">{profile.brandName}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Industry</p>
                  <p className="font-medium capitalize">{profile.industry?.replace(/-/g, " ")}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Voice</p>
                  <p className="font-medium capitalize">{profile.voiceTone}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Audience</p>
                  <p className="font-medium">{profile.audienceAge}, {profile.audienceGender}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Goal</p>
                  <p className="font-medium capitalize">{profile.primaryGoal}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Platforms</p>
                  <p className="font-medium">{profile.platforms?.join(", ") || "Not set"}</p>
                </div>
              </div>

              {competitors.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Competitors ({competitors.length})</p>
                  <p className="text-sm">{competitors.map((c) => c.name).join(", ")}</p>
                </div>
              )}

              {voiceExamples.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Voice Examples ({voiceExamples.length})</p>
                  <p className="text-sm truncate">{voiceExamples[0]?.content?.slice(0, 80)}...</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setShowPreview(false)}>Edit</Button>
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? "Finishing..." : "Complete Setup"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
