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

const AGE_RANGES = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const GENDER_OPTIONS = ["all", "male", "female"];
const LOCATION_OPTIONS = ["India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "Dubai", "Singapore", "Global"];

export default function Step3() {
  const router = useRouter();
  const profile = useBrandStore((s) => s.profile);
  const updateProfile = useBrandStore((s) => s.updateProfile);
  const fetchProfile = useBrandStore((s) => s.fetchProfile);

  const [audienceAge, setAudienceAge] = useState("25-34");
  const [audienceGender, setAudienceGender] = useState("all");
  const [audienceLocation, setAudienceLocation] = useState<string[]>([]);
  const [audienceInterests, setAudienceInterests] = useState<string[]>([]);
  const [audiencePainPoints, setAudiencePainPoints] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setAudienceAge(profile.audienceAge || "25-34");
      setAudienceGender(profile.audienceGender || "all");
      setAudienceLocation(profile.audienceLocation || []);
      setAudienceInterests(profile.audienceInterests || []);
      setAudiencePainPoints(profile.audiencePainPoints || []);
    }
  }, [profile]);

  const toggleLocation = (loc: string) => {
    setAudienceLocation((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      await updateProfile({ audienceAge, audienceGender, audienceLocation, audienceInterests, audiencePainPoints });
      router.push("/onboarding/step-4");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={3} />
      <Card className="p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold">Who is your audience?</h1>
          <p className="text-sm text-muted-foreground mt-1">Help our AI speak directly to your people.</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Age Range</Label>
              <Select value={audienceAge} onValueChange={(v) => v !== null && setAudienceAge(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AGE_RANGES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={audienceGender} onValueChange={(v) => v !== null && setAudienceGender(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Locations</Label>
            <div className="flex flex-wrap gap-2">
              {LOCATION_OPTIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => toggleLocation(loc)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    audienceLocation.includes(loc)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-ring"
                  )}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Interests</Label>
            <ChipInput value={audienceInterests} onChange={setAudienceInterests} placeholder='e.g. "fashion", "fitness", "tech"' />
          </div>

          <div className="space-y-1.5">
            <Label>Pain Points</Label>
            <ChipInput value={audiencePainPoints} onChange={setAudiencePainPoints} placeholder='e.g. "lack of time", "budget constraints"' />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/onboarding/step-2")}>Back</Button>
          <Button onClick={handleNext} disabled={saving}>{saving ? "Saving..." : "Next"}</Button>
        </div>
      </Card>
    </div>
  );
}
