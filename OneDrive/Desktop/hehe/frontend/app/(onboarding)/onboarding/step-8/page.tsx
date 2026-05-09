"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { Input } from "@/components/ui/input";
import { useOnboardingStore, derivePalette } from "@/store/onboarding";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  { hex: "#2563eb", name: "Deep Blue" },
  { hex: "#f97316", name: "Coral" },
  { hex: "#16a34a", name: "Forest Green" },
  { hex: "#9333ea", name: "Royal Purple" },
  { hex: "#ea580c", name: "Warm Orange" },
  { hex: "#db2777", name: "Hot Pink" },
  { hex: "#1e3a8a", name: "Navy" },
  { hex: "#0d9488", name: "Teal" },
  { hex: "#dc2626", name: "Crimson" },
  { hex: "#d97706", name: "Gold" },
  { hex: "#475569", name: "Slate" },
  { hex: "#374151", name: "Charcoal" },
];

const FONTS = [
  {
    id: "modern-sans",
    name: "Modern Sans",
    primary: "Inter",
    secondary: "Inter",
    headline: "Building something great",
    body: "Clear, modern communication that connects instantly with your audience.",
  },
  {
    id: "elegant-serif",
    name: "Elegant Serif",
    primary: "Playfair Display",
    secondary: "Lato",
    headline: "Timeless elegance",
    body: "Refined typography that speaks to sophistication and class.",
  },
  {
    id: "bold-display",
    name: "Bold Display",
    primary: "Poppins",
    secondary: "Poppins",
    headline: "Make an impact",
    body: "Strong, confident typography that demands attention.",
  },
  {
    id: "classic-mix",
    name: "Classic Mix",
    primary: "Merriweather",
    secondary: "Source Sans 3",
    headline: "Content that converts",
    body: "Traditional readability meets modern marketing strategy.",
  },
];

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 210, s: 0.65, l: 0.5 };
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s, l };
}

function isValidHex(hex: string): boolean {
  return /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(hex);
}

export default function Step8() {
  const router = useRouter();
  const store = useOnboardingStore();

  const [colorInput, setColorInput] = useState(store.brandColors.brandPrimary);
  const [font, setFont] = useState("modern-sans");
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const primaryColor = isValidHex(colorInput) ? colorInput : "#6366f1";
  const palette = derivePalette(primaryColor);

  const handleNext = async () => {
    setSaving(true);
    try {
      store.setBrandColors({
        brandPrimary: primaryColor,
        brandLight: palette.brandLight,
        brandDark: palette.brandDark,
        lightBg: palette.lightBg,
        lightBorder: palette.lightBorder,
        darkBg: palette.darkBg,
      });

      const selectedFont = FONTS.find((f) => f.id === font) ?? FONTS[0];
      store.setFonts(selectedFont.primary, selectedFont.secondary);

      if (store.profileId) {
        await api.patch(`/brand-voice/profiles/${store.profileId}`, {
          primaryColor: primaryColor,
          brandLight: palette.brandLight,
          brandDark: palette.brandDark,
          lightBg: palette.lightBg,
          lightBorder: palette.lightBorder,
          darkBg: palette.darkBg,
          fontPrimary: selectedFont.primary,
          fontSecondary: selectedFont.secondary,
        });
      }

      router.push("/onboarding/step-9");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={8} />
      <Card className="p-6 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Your brand look</h1>
          <p className="text-sm text-muted-foreground mt-1">
            One color. Your AI builds the rest.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold">Primary Brand Color</h2>
          <div className="flex items-center gap-4">
            <div
              className="w-32 h-32 rounded-full border-4 border-border flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="text-white font-bold text-xs drop-shadow">
                BRAND
              </span>
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex gap-2 items-center">
                <Input
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  placeholder="#6366f1"
                  className="max-w-[140px] font-mono"
                />
              </div>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map(({ hex, name }) => (
                  <button
                    key={hex}
                    title={name}
                    onClick={() => setColorInput(hex)}
                    className={cn(
                      "w-8 h-8 rounded-md border-2 transition-transform hover:scale-110",
                      colorInput.toLowerCase() === hex.toLowerCase()
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Live Preview</Label>
            <div className="grid grid-cols-6 gap-2">
              {[
                { key: "brandPrimary", label: "Primary" },
                { key: "brandLight", label: "Light" },
                { key: "brandDark", label: "Dark" },
                { key: "lightBg", label: "BG" },
                { key: "lightBorder", label: "Border" },
                { key: "darkBg", label: "Dark BG" },
              ].map(({ key, label }) => (
                <div key={key} className="text-center">
                  <div
                    className="w-full h-8 rounded-md border border-border"
                    style={{ backgroundColor: palette[key as keyof typeof palette] }}
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold">Font Preference</h2>
          <div className="grid grid-cols-2 gap-3">
            {FONTS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFont(f.id)}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-colors",
                  font === f.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-ring"
                )}
              >
                <p
                  className="text-lg font-semibold leading-tight mb-1"
                  style={{ fontFamily: f.primary }}
                >
                  {f.headline}
                </p>
                <p
                  className="text-xs text-muted-foreground leading-snug"
                  style={{ fontFamily: f.secondary }}
                >
                  {f.body}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {f.name}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Logo / Brand Mark (optional)</h2>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".svg,.png,.jpg";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file && file.size <= 2 * 1024 * 1024) {
                    const reader = new FileReader();
                    reader.onload = () =>
                      setLogoPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
            >
              Add your logo
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const initials = (store.businessName || "B")
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase();
                setLogoPreview(initials);
              }}
            >
              Use my initials
            </Button>
          </div>
          {logoPreview && (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {logoPreview.length <= 3 ? (
                logoPreview
              ) : (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              )}
            </div>
          )}
        </section>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/onboarding/step-7")}>
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
