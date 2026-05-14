"use client";

import Link from "next/link";
import { ArrowRight, Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const COMPARISON = [
  { feature: "AI content generation", diyaa: "Full AI agency (5 agents)", competitor: "AI post generator" },
  { feature: "Brand voice training", diyaa: true, competitor: false },
  { feature: "Content categories/pillars", diyaa: true, competitor: true },
  { feature: "Carousel generator", diyaa: true, competitor: false },
  { feature: "Animated video templates", diyaa: true, competitor: false },
  { feature: "ROI tracking", diyaa: true, competitor: false },
  { feature: "Competitor monitoring", diyaa: true, competitor: false },
  { feature: "White-label portals", diyaa: true, competitor: false },
  { feature: "Evergreen content recycling", diyaa: "Via recurring posts", competitor: true },
  { feature: "RSS auto-posting", diyaa: true, competitor: true },
  { feature: "Multi-platform scheduling", diyaa: true, competitor: true },
  { feature: "Canva integration", diyaa: "Built-in AI design", competitor: true },
  { feature: "Hindi/regional languages", diyaa: true, competitor: false },
  { feature: "Pricing (comparable)", diyaa: "₹9,999/mo", competitor: "$79/mo (~₹6,500)" },
];

export default function SocialBeeComparison() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Diyaa AI vs SocialBee</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            SocialBee is solid for content categorization and recycling. Diyaa AI generates the content for you — in your voice, with visuals, with revenue tracking.
          </p>
        </div>

        <div className="rounded-2xl border border-border overflow-hidden mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-semibold w-1/3">Feature</th>
                <th className="text-center p-4 font-bold text-primary w-1/3"><Zap className="size-4 inline mr-1" />Diyaa AI</th>
                <th className="text-center p-4 font-semibold text-muted-foreground w-1/3">SocialBee</th>
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

        <div className="text-center p-8 bg-card border border-border rounded-2xl">
          <h3 className="text-2xl font-bold mb-3">Stop categorizing. Start generating.</h3>
          <p className="text-muted-foreground mb-6">14-day free trial. AI creates your content categories automatically.</p>
          <Link href="/signup"><Button size="lg" className="rounded-full px-8 gap-2"><Zap className="size-4" />Start Free Trial<ArrowRight className="size-4" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
