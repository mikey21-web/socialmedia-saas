"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2, Sparkles, AtSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function Step0AutoOnboard() {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [x, setX] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    if (!websiteUrl.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/onboarding/scrape-website", {
        websiteUrl: websiteUrl.trim(),
        socialHandles: {
          ...(instagram ? { instagram } : {}),
          ...(x ? { x } : {}),
          ...(linkedin ? { linkedin } : {}),
        },
      });

      // Apply suggestions to brand profile
      await api.post("/onboarding/apply-suggestions", {
        suggestions: res.data.suggestions,
      });

      // Navigate to step 1 with pre-filled data
      router.push("/onboarding/step-1");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to analyze website. You can skip and fill manually.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="size-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Set up in 30 seconds</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Paste your website URL and we&apos;ll auto-detect your brand voice, colors, audience, and offers. Zero blank prompts.
          </p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <Globe className="size-4" /> Website URL
            </Label>
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourbusiness.com"
              type="url"
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium">Social handles (optional, helps accuracy)</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <AtSign className="size-3" /> Instagram
                </Label>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@handle"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <AtSign className="size-3" /> X / Twitter
                </Label>
                <Input
                  value={x}
                  onChange={(e) => setX(e.target.value)}
                  placeholder="@handle"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <AtSign className="size-3" /> LinkedIn
                </Label>
                <Input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="company-slug"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <Button
            onClick={handleScrape}
            disabled={!websiteUrl.trim() || loading}
            className="w-full h-11 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing your brand...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Auto-detect my brand
              </>
            )}
          </Button>

          <div className="text-center">
            <button
              onClick={() => router.push("/onboarding/step-1")}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Skip — I&apos;ll fill in manually
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
