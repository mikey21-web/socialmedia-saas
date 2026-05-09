"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { Input } from "@/components/ui/input";
import { useOnboardingStore, type ExtractedProfile } from "@/store/onboarding";
import { api } from "@/lib/api";
import { X, Plus } from "lucide-react";

const SLIDERS = [
  { key: "formality", left: "Professional", right: "Casual" },
  { key: "playfulness", left: "Serious", right: "Fun" },
  { key: "warmth", left: "Corporate", right: "Friendly" },
  { key: "urgency", left: "Relaxed", right: "Urgent" },
] as const;

const EMOJI_LABELS = ["Rarely", "Sometimes", "Often"];

export default function Step7() {
  const router = useRouter();
  const store = useOnboardingStore();
  const profile = store.extractedProfile;

  const [formality, setFormality] = useState<number>(
    Math.round((profile?.toneDimensions?.formality ?? 0.5) * 10)
  );
  const [playfulness, setPlayfulness] = useState<number>(
    Math.round((profile?.toneDimensions?.playfulness ?? 0.5) * 10)
  );
  const [warmth, setWarmth] = useState<number>(
    Math.round((profile?.toneDimensions?.warmth ?? 0.5) * 10)
  );
  const [urgency, setUrgency] = useState<number>(
    Math.round((profile?.toneDimensions?.urgency ?? 0.3) * 10)
  );
  const [commonWords, setCommonWords] = useState<string[]>(
    profile?.vocabularyBank?.commonWords?.slice(0, 10) ?? []
  );
  const [avoidWords, setAvoidWords] = useState<string[]>(
    profile?.vocabularyBank?.avoidWords ?? []
  );
  const [newCommonWord, setNewCommonWord] = useState("");
  const [newAvoidWord, setNewAvoidWord] = useState("");
  const [useEmojis, setUseEmojis] = useState(
    (profile?.emojiPatterns?.frequency ?? 0.4) > 0.2
  );
  const [emojiFrequency, setEmojiFrequency] = useState<number>(
    Math.round((profile?.emojiPatterns?.frequency ?? 0.4) * 10)
  );
  const [detectedEmojis] = useState<string[]>(
    profile?.emojiPatterns?.preferred ?? []
  );
  const [hashtagPlacement, setHashtagPlacement] = useState<string>(
    profile?.hashtagStyle?.placement ?? "end"
  );
  const [hashtagCount, setHashtagCount] = useState<number>(
    profile?.hashtagStyle?.count ?? 8
  );
  const [hashtagFormat, setHashtagFormat] = useState<string>(
    profile?.hashtagStyle?.format ?? "lowercase"
  );
  const [saving, setSaving] = useState(false);

  const addWord = (
    word: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = word.trim().toLowerCase();
    if (trimmed && !word.includes(" ")) {
      setter((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    }
  };

  const removeWord = (
    word: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => prev.filter((w) => w !== word));
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const refinedProfile: ExtractedProfile = {
        toneDimensions: {
          formality: formality / 10,
          playfulness: playfulness / 10,
          warmth: warmth / 10,
          urgency: urgency / 10,
          technicality: profile?.toneDimensions?.technicality ?? 0.3,
          authority: profile?.toneDimensions?.authority ?? 0.5,
          vulnerability: profile?.toneDimensions?.vulnerability ?? 0.3,
          humor: profile?.toneDimensions?.humor ?? 0.4,
          directness: profile?.toneDimensions?.directness ?? 0.6,
          inspiration: profile?.toneDimensions?.inspiration ?? 0.5,
        },
        vocabularyBank: {
          commonWords,
          avoidWords,
          industryTerms: profile?.vocabularyBank?.industryTerms ?? [],
        },
        emojiPatterns: {
          frequency: useEmojis ? emojiFrequency / 10 : 0,
          preferred: detectedEmojis,
          avoidEmojis: profile?.emojiPatterns?.avoidEmojis ?? [],
        },
        hashtagStyle: {
          placement: hashtagPlacement as "start" | "middle" | "end",
          count: hashtagCount,
          format: hashtagFormat as "lowercase" | "camelcase" | "uppercase",
        },
        sampleCount: store.sampleCount,
      };

      store.setExtractedProfile(refinedProfile);

      if (store.profileId) {
        await api.patch(`/brand-voice/profiles/${store.profileId}`, {
          toneDimensions: refinedProfile.toneDimensions,
          vocabularyBank: refinedProfile.vocabularyBank,
          emojiPatterns: refinedProfile.emojiPatterns,
          hashtagStyle: refinedProfile.hashtagStyle,
        });
      }

      router.push("/onboarding/step-8");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={7} />
      <Card className="p-6 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Review your brand voice</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your AI analyzed your writing. Adjust if anything looks off.
          </p>
        </div>

        <div className="space-y-5">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Tone</h2>
            {SLIDERS.map(({ key, left, right }) => {
              const value =
                key === "formality"
                  ? formality
                  : key === "playfulness"
                  ? playfulness
                  : key === "warmth"
                  ? warmth
                  : urgency;
              const setter =
                key === "formality"
                  ? setFormality
                  : key === "playfulness"
                  ? setPlayfulness
                  : key === "warmth"
                  ? setWarmth
                  : setUrgency;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{left}</span>
                    <span className="font-medium text-foreground">
                      {value}/10
                    </span>
                    <span>{right}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={value}
                    onChange={(e) => setter(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              );
            })}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Vocabulary</h2>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Words you use often
              </Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {commonWords.map((w) => (
                  <span
                    key={w}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs"
                  >
                    {w}
                    <button onClick={() => removeWord(w, setCommonWords)}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newCommonWord}
                  onChange={(e) => setNewCommonWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addWord(newCommonWord, setCommonWords);
                      setNewCommonWord("");
                    }
                  }}
                  placeholder="Add a word..."
                  className="h-8 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    addWord(newCommonWord, setCommonWords);
                    setNewCommonWord("");
                  }}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Words to avoid
              </Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {avoidWords.map((w) => (
                  <span
                    key={w}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs"
                  >
                    {w}
                    <button onClick={() => removeWord(w, setAvoidWords)}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newAvoidWord}
                  onChange={(e) => setNewAvoidWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addWord(newAvoidWord, setAvoidWords);
                      setNewAvoidWord("");
                    }
                  }}
                  placeholder="Add a word..."
                  className="h-8 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    addWord(newAvoidWord, setAvoidWords);
                    setNewAvoidWord("");
                  }}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Emoji Style</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setUseEmojis(true)}
                className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                  useEmojis
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-ring"
                }`}
              >
                I use emojis
              </button>
              <button
                onClick={() => setUseEmojis(false)}
                className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                  !useEmojis
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-ring"
                }`}
              >
                I don&apos;t use emojis
              </button>
            </div>
            {useEmojis && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Rarely</span>
                  <span className="font-medium text-foreground">
                    {EMOJI_LABELS[Math.min(Math.round(emojiFrequency / 3.33), 2)]} ({emojiFrequency}/10)
                  </span>
                  <span>Often</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={emojiFrequency}
                  onChange={(e) => setEmojiFrequency(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
            {detectedEmojis.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {detectedEmojis.map((e) => (
                  <span
                    key={e}
                    className="px-2 py-0.5 rounded bg-muted text-lg"
                  >
                    {e}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Hashtag Style</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Placement</Label>
                <div className="flex gap-2">
                  {(["start", "middle", "end"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setHashtagPlacement(p)}
                      className={`px-2 py-1 rounded text-xs border capitalize transition-colors ${
                        hashtagPlacement === p
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-ring"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Count (0-30)</Label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={hashtagCount}
                  onChange={(e) =>
                    setHashtagCount(
                      Math.max(0, Math.min(30, Number(e.target.value)))
                    )
                  }
                  className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Casing</Label>
              <div className="flex gap-2">
                {[
                  { id: "lowercase", label: "#lowercase" },
                  { id: "camelcase", label: "#CamelCase" },
                  { id: "uppercase", label: "#ALL_CAPS" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setHashtagFormat(id)}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${
                      hashtagFormat === id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-ring"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/onboarding/step-6")}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={saving}>
            {saving ? "Saving..." : "Next"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
