"use client";

import Link from "next/link";
import { ArrowRight, Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const COMPARISON = [
  { feature: "Pricing model", diyaa: "Flat ₹2,999-19,999/mo", competitor: "Credit-based $32-249/mo" },
  { feature: "Credit caps", diyaa: "No caps — unlimited generation", competitor: "1,300-10,000 credits/mo" },
  { feature: "Brand voice training", diyaa: true, competitor: false },
  { feature: "5 AI specialist agents", diyaa: true, competitor: false },
  { feature: "Boss Agent (reviews own output)", diyaa: true, competitor: false },
  { feature: "Carousel generator", diyaa: true, competitor: true },
  { feature: "Animated video templates (15)", diyaa: true, competitor: false },
  { feature: "UGC video pipeline", diyaa: true, competitor: false },
  { feature: "ROI / revenue tracking", diyaa: true, competitor: false },
  { feature: "Performance learning loop", diyaa: true, competitor: false },
  { feature: "Competitor monitoring", diyaa: true, competitor: true },
  { feature: "White-label client portals", diyaa: true, competitor: false },
  { feature: "Hindi/regional languages (8)", diyaa: true, competitor: false },
  { feature: "Multi-platform scheduling", diyaa: true, competitor: true },
  { feature: "AI image generation", diyaa: true, competitor: true },
  { feature: "Hashtag suggestions", diyaa: true, competitor: true },
  { feature: "Per-brand pricing", diyaa: "Included", competitor: "Extra cost per brand" },
];

export default function PredisComparison() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Diyaa AI vs Predis.ai</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Predis.ai uses credit-based pricing that adds up fast. Diyaa AI gives you flat-rate unlimited generation with a full AI agency team.
          </p>
        </div>

        <div className="rounded-2xl border border-border overflow-hidden mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-semibold w-1/3">Feature</th>
                <th className="text-center p-4 font-bold text-primary w-1/3"><Zap className="size-4 inline mr-1" />Diyaa AI</th>
                <th className="text-center p-4 font-semibold text-muted-foreground w-1/3">Predis.ai</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-4 font-medium">{row.feature}</td>
                  <td className="p-4 text-center">{row.diyaa === true ? <Check className="size-5 text-emerald-500 mx-auto" /> : row.diyaa === false ? <X className="size-5 text-muted-foreground mx-auto" /> : <span className="text-sm font-medium">{row.diyaa}</span>}</td>
                  <td className="p-4 text-center">{row.competitor === true ? <Check className="size-5 text-emerald-500 mx-auto" /> : row.competitor === false ? <X className="size-5 text-muted-foreground mx-auto" /> : <span className="text-sm text-muted-foreground">{row.competitor}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-bold">Why teams switch from Predis to Diyaa AI</h2>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex gap-2"><Check className="size-5 text-emerald-500 shrink-0" />No more credit anxiety — generate as much as you need</li>
            <li className="flex gap-2"><Check className="size-5 text-emerald-500 shrink-0" />Content actually sounds like your brand, not generic AI</li>
            <li className="flex gap-2"><Check className="size-5 text-emerald-500 shrink-0" />See which posts drive revenue, not just impressions</li>
            <li className="flex gap-2"><Check className="size-5 text-emerald-500 shrink-0" />One price includes all brands — no per-brand upsell</li>
          </ul>
        </div>

        <div className="text-center p-8 bg-card border border-border rounded-2xl">
          <h3 className="text-2xl font-bold mb-3">Switch from Predis in 10 minutes</h3>
          <p className="text-muted-foreground mb-6">14-day free trial. Import your brand settings instantly.</p>
          <Link href="/signup"><Button size="lg" className="rounded-full px-8 gap-2"><Zap className="size-4" />Start Free Trial<ArrowRight className="size-4" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
