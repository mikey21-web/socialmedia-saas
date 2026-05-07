"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { ChipInput } from "@/components/onboarding/ChipInput";
import { useBrandStore } from "@/store/brand";
import { cn } from "@/lib/utils";

const TONES = ["professional", "casual", "witty", "genz", "educational", "luxe"];
const TRAIT_OPTIONS = ["confident", "playful", "direct", "empathetic", "bold", "warm", "authoritative", "friendly", "sarcastic", "inspirational"];
const EMOJI_OPTIONS = ["none", "sparse", "moderate", "heavy"];
const HASHTAG_OPTIONS = ["none", "minimal", "moderate", "heavy"];

export default function Step2() {
  const router = useRouter();
  const profile = useBrandStore((s) => s.profile);
  const updateProfile = useBrandStore((s) => s.updateProfile);
  const fetchProfile = useBrandStore((s) => s.fetchProfile);

  const [voiceTone, setVoiceTone] = useState("professional");
  const [voiceTraits, setVoiceTraits] = useState<string[]>([]);
  const [formalityLevel, setFormalityLevel] = useState(5);
  const [emojiUsage, setEmojiUsage] = useState("moderate");
  const [hashtagStyle, setHashtagStyle] = useState("moderate");
  const [alwaysWords, setAlwaysWords] = useState<string[]>([]);
  const [neverWords, setNeverWords] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setVoiceTone(profile.voiceTone || "professional");
      setVoiceTraits(profile.voiceTraits || []);
      setFormalityLevel(profile.formalityLevel || 5);
      setEmojiUsage(profile.emojiUsage || "moderate");
      setHashtagStyle(profile.hashtagStyle || "moderate");
      setAlwaysWords(profile.alwaysWords || []);
      setNeverWords(profile.neverWords || []);
    }
  }, [profile]);

  const toggleTrait = (t: string) => {
    setVoiceTraits((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      await updateProfile({ voiceTone, voiceTraits, formalityLevel, emojiUsage, hashtagStyle, alwaysWords, neverWords });
      router.push("/onboarding/step-3");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={2} />
      <Card className="p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold">Define your voice</h1>
          <p className="text-sm text-muted-foreground mt-1">How should your brand sound online?</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select value={voiceTone} onValueChange={(v) => v !== null && setVoiceTone(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Voice Traits</Label>
            <div className="flex flex-wrap gap-2">
              {TRAIT_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTrait(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    voiceTraits.includes(t)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-ring"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Formality Level: {formalityLevel}/10</Label>
            <input type="range" min={1} max={10} value={formalityLevel} onChange={(e) => setFormalityLevel(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-[10px] text-muted-foreground"><span>Casual</span><span>Formal</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Emoji Usage</Label>
              <Select value={emojiUsage} onValueChange={(v) => v !== null && setEmojiUsage(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMOJI_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Hashtag Style</Label>
              <Select value={hashtagStyle} onValueChange={(v) => v !== null && setHashtagStyle(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HASHTAG_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Always use these words</Label>
            <ChipInput value={alwaysWords} onChange={setAlwaysWords} placeholder='e.g. "sustainable", "handcrafted"' />
          </div>

          <div className="space-y-1.5">
            <Label>Never use these words</Label>
            <ChipInput value={neverWords} onChange={setNeverWords} placeholder='e.g. "cheap", "discount"' />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/onboarding/step-1")}>Back</Button>
          <Button onClick={handleNext} disabled={saving}>{saving ? "Saving..." : "Next"}</Button>
        </div>
      </Card>
    </div>
  );
}
