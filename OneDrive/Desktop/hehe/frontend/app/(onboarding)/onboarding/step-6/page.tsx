"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { useOnboardingStore } from "@/store/onboarding";
import { api } from "@/lib/api";
import { AlertCircle, Globe, Plus } from "lucide-react";

export default function Step6() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [textarea, setTextarea] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [dots, setDots] = useState(0);

  const sampleCount = textarea
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10).length;

  useEffect(() => {
    if (textarea) setTextarea(store.brandVoiceSamples.join("\n\n"));
  }, []);

  useEffect(() => {
    if (extracting) {
      const interval = setInterval(() => setDots((d) => (d + 1) % 4), 400);
      return () => clearInterval(interval);
    }
  }, [extracting]);

  const handleNext = async () => {
    const samples = textarea
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    if (samples.length < 5) {
      alert("Please provide at least 5 writing samples");
      return;
    }

    setExtracting(true);
    store.setBrandVoiceSamples(samples);
    store.setIsExtracting(true);

    try {
      const posts = samples.map((caption) => ({
        caption,
        hashtags: caption.match(/#\w+/g) ?? [],
        platform: "manual",
      }));

      const { data } = await api.post("/brand-voice/upload-samples", { posts });

      store.setExtractedProfile({
        toneDimensions: data.extraction?.toneDimensions ?? {
          formality: 0.5, playfulness: 0.5, warmth: 0.5, urgency: 0.3,
          technicality: 0.3, authority: 0.5, vulnerability: 0.3,
          humor: 0.4, directness: 0.6, inspiration: 0.5,
        },
        vocabularyBank: data.extraction?.vocabularyBank ?? { commonWords: [], avoidWords: [], industryTerms: [] },
        emojiPatterns: data.extraction?.emojiPatterns ?? { frequency: 0.4, preferred: [], avoidEmojis: [] },
        hashtagStyle: data.extraction?.hashtagStyle ?? { placement: "end", count: 8, format: "lowercase" },
        sampleCount: samples.length,
      });

      store.setSampleCount(samples.length);

      if (data.id) store.setProfileId(data.id);

      router.push("/onboarding/step-7");
    } catch {
      alert("Failed to analyze samples. Using defaults.");
      store.setExtractedProfile({
        toneDimensions: { formality: 0.5, playfulness: 0.5, warmth: 0.5, urgency: 0.3, technicality: 0.3, authority: 0.5, vulnerability: 0.3, humor: 0.4, directness: 0.6, inspiration: 0.5 },
        vocabularyBank: { commonWords: [], avoidWords: [], industryTerms: [] },
        emojiPatterns: { frequency: 0.4, preferred: [], avoidEmojis: [] },
        hashtagStyle: { placement: "end", count: 8, format: "lowercase" },
        sampleCount: samples.length,
      });
      router.push("/onboarding/step-7");
    } finally {
      setExtracting(false);
      store.setIsExtracting(false);
    }
  };

  const handleSkip = () => {
    router.push("/onboarding/step-7");
  };

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={6} />
      <Card className="p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold">Teaching your AI your brand voice</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Paste 10-30 of your best past captions below. Your AI will learn exactly how you write.
          </p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Label className="text-xs text-muted-foreground mb-1 block">
              {sampleCount} sample{sampleCount !== 1 ? "s" : ""} detected
              {sampleCount < 5 && sampleCount > 0 && (
                <span className="text-amber-600 ml-1">(min 5 required)</span>
              )}
            </Label>
            <textarea
              value={textarea}
              onChange={(e) => setTextarea(e.target.value)}
              placeholder="Paste your Instagram captions, WhatsApp messages to customers, or any text you've written for your business — one per line or separated by blank lines"
              className="w-full min-h-[300px] p-3 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Import automatically</p>
            <div className="flex gap-2">
              {[
                { name: "Instagram", icon: Globe, slug: "instagram" },
                { name: "Facebook", icon: Globe, slug: "facebook" },
                { name: "LinkedIn", icon: Globe, slug: "linkedin" },
              ].map(({ name, icon: Icon, slug }) => (
                <Button
                  key={slug}
                  variant="outline"
                  size="sm"
                  onClick={() => alert(`${name} import — coming soon!`)}
                  className="flex items-center gap-2"
                >
                  <Icon className="size-4" />
                  {name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={handleSkip} className="text-xs">Skip for now</Button>
          <Button onClick={handleNext} disabled={loading || extracting || sampleCount < 5}>
            {extracting ? `Analyzing${".".repeat(dots)}` : sampleCount < 5 ? `Need ${5 - sampleCount} more` : "Next"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
