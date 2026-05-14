"use client";

import Link from "next/link";
import { ArrowRight, Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const COMPARISON = [
  { feature: "Starting price", diyaa: "₹2,999/mo", competitor: "$99/mo (~₹8,200)" },
  { feature: "AI content generation", diyaa: "Full AI agency", competitor: "OwlyWriter AI (basic)" },
  { feature: "Brand voice training", diyaa: true, competitor: false },
  { feature: "Carousel generator", diyaa: true, competitor: false },
  { feature: "Animated video templates", diyaa: true, competitor: false },
  { feature: "ROI tracking", diyaa: true, competitor: "Enterprise only" },
  { feature: "Competitor monitoring", diyaa: true, competitor: "Add-on ($$$)" },
  { feature: "White-label portals", diyaa: true, competitor: "Enterprise only" },
  { feature: "Hindi/regional languages", diyaa: true, competitor: false },
  { feature: "Social listening", diyaa: "Coming Q4 2026", competitor: true },
  { feature: "Paid ads management", diyaa: "Coming Q4 2026", competitor: true },
  { feature: "Team size (Pro)", diyaa: "3 members", competitor: "1 user ($99)" },
  { feature: "Platforms supported", diyaa: "6", competitor: "10+" },
  { feature: "Contract required", diyaa: "No — cancel anytime", competitor: "Annual recommended" },
];

export default function HootsuiteComparison() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Diyaa AI vs Hootsuite</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hootsuite is built for enterprise teams with big budgets. Diyaa AI gives SMBs the same power at 1/3 the price — with AI that actually creates content.
          </p>
        </div>

        <div className="rounded-2xl border border-border overflow-hidden mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-semibold w-1/3">Feature</th>
                <th className="text-center p-4 font-bold text-primary w-1/3"><Zap className="size-4 inline mr-1" />Diyaa AI</th>
                <th className="text-center p-4 font-semibold text-muted-foreground w-1/3">Hootsuite</th>
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
          <h3 className="text-2xl font-bold mb-3">Enterprise features at SMB prices</h3>
          <p className="text-muted-foreground mb-6">14-day free trial. No annual contract.</p>
          <Link href="/signup"><Button size="lg" className="rounded-full px-8 gap-2"><Zap className="size-4" />Start Free Trial<ArrowRight className="size-4" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
