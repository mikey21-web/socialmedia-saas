"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { useBrandStore } from "@/store/brand";

const INDUSTRIES = [
  "fashion-d2c",
  "saas",
  "real-estate",
  "ecommerce",
  "health-wellness",
  "food-beverage",
  "education",
  "finance",
  "tech-startup",
  "agency",
  "personal-brand",
  "other",
];

export default function Step1() {
  const router = useRouter();
  const profile = useBrandStore((s) => s.profile);
  const createProfile = useBrandStore((s) => s.createProfile);
  const updateProfile = useBrandStore((s) => s.updateProfile);
  const fetchProfile = useBrandStore((s) => s.fetchProfile);

  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setBrandName(profile.brandName || "");
      setIndustry(profile.industry || "");
      setDescription(profile.description || "");
    }
  }, [profile]);

  const handleNext = async () => {
    if (!brandName.trim() || !industry || !description.trim()) return;
    setSaving(true);
    try {
      if (profile) {
        await updateProfile({ brandName, industry, description });
      } else {
        await createProfile({ brandName, industry, description });
      }
      router.push("/onboarding/step-2");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={1} />
      <Card className="p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold">Tell us about your brand</h1>
          <p className="text-sm text-muted-foreground mt-1">
            This helps our AI understand your identity.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Brand Name</Label>
            <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. Acme Studios" />
          </div>

          <div className="space-y-1.5">
            <Label>Industry</Label>
            <Select value={industry} onValueChange={(v) => v !== null && setIndustry(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="2-3 sentence elevator pitch about your brand..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            disabled={!brandName.trim() || !industry || !description.trim() || saving}
          >
            {saving ? "Saving..." : "Next"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
