import Link from "next/link";
import { ArrowRight, Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Diyaa AI vs Postiz — Which is Better for Social Media Management?",
  description: "Compare Diyaa AI and Postiz side-by-side. See pricing, features, AI capabilities, and which tool is right for your business.",
};

const COMPARISON = [
  { feature: "AI Content Generation", diyaa: true, competitor: "Basic (single prompt)", winner: "diyaa" },
  { feature: "Brand Voice Training", diyaa: true, competitor: false, winner: "diyaa" },
  { feature: "5 AI Specialist Agents", diyaa: true, competitor: false, winner: "diyaa" },
  { feature: "Carousel Generator", diyaa: true, competitor: false, winner: "diyaa" },
  { feature: "Animated Video Templates", diyaa: true, competitor: false, winner: "diyaa" },
  { feature: "UGC Video Pipeline", diyaa: true, competitor: false, winner: "diyaa" },
  { feature: "Multi-platform Publishing", diyaa: true, competitor: true, winner: "tie" },
  { feature: "Content Scheduling", diyaa: true, competitor: true, winner: "tie" },
  { feature: "Analytics Dashboard", diyaa: true, competitor: true, winner: "tie" },
  { feature: "ROI / Revenue Tracking", diyaa: true, competitor: false, winner: "diyaa" },
  { feature: "Performance Learning Loop", diyaa: true, competitor: false, winner: "diyaa" },
  { feature: "Competitor Monitoring", diyaa: true, competitor: false, winner: "diyaa" },
  { feature: "White-label Client Portals", diyaa: true, competitor: false, winner: "diyaa" },
  { feature: "Hindi/Regional Language Support", diyaa: true, competitor: false, winner: "diyaa" },
  { feature: "Open Source", diyaa: false, competitor: true, winner: "competitor" },
  { feature: "Self-hostable", diyaa: false, competitor: true, winner: "competitor" },
  { feature: "Pricing (Pro)", diyaa: "₹9,999/mo", competitor: "Free (self-host) or $29/mo (hosted)", winner: "competitor" },
];

export default function PostizComparison() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Diyaa AI vs Postiz</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Postiz is a great open-source scheduling tool. Diyaa AI is a full AI marketing agency.
            Here&apos;s how they compare.
          </p>
        </div>

        <div className="rounded-2xl border border-border overflow-hidden mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-semibold w-1/3">Feature</th>
                <th className="text-center p-4 font-bold text-primary w-1/3">
                  <span className="flex items-center justify-center gap-1"><Zap className="size-4" /> Diyaa AI</span>
                </th>
                <th className="text-center p-4 font-semibold text-muted-foreground w-1/3">Postiz</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-4 font-medium">{row.feature}</td>
                  <td className="p-4 text-center">
                    {row.diyaa === true ? <Check className="size-5 text-emerald-500 mx-auto" /> :
                     row.diyaa === false ? <X className="size-5 text-muted-foreground mx-auto" /> :
                     <span className="text-sm font-medium">{row.diyaa}</span>}
                  </td>
                  <td className="p-4 text-center">
                    {row.competitor === true ? <Check className="size-5 text-emerald-500 mx-auto" /> :
                     row.competitor === false ? <X className="size-5 text-muted-foreground mx-auto" /> :
                     <span className="text-sm text-muted-foreground">{row.competitor}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-8 mb-12">
          <section>
            <h2 className="text-2xl font-bold mb-3">When to choose Postiz</h2>
            <p className="text-muted-foreground leading-7">
              Choose Postiz if you want a free, self-hosted scheduling tool and you&apos;re comfortable
              managing your own server. It&apos;s great for developers who want full control and don&apos;t
              need AI content generation.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-3">When to choose Diyaa AI</h2>
            <p className="text-muted-foreground leading-7">
              Choose Diyaa AI if you want a full AI marketing team that generates content in your brand
              voice, creates carousels and videos, monitors competitors, tracks ROI, and manages client
              portals. You don&apos;t want to manage servers — you want to grow your business.
            </p>
          </section>
        </div>

        <div className="text-center p-8 bg-card border border-border rounded-2xl">
          <h3 className="text-2xl font-bold mb-3">Ready to try Diyaa AI?</h3>
          <p className="text-muted-foreground mb-6">14-day free trial. No credit card required.</p>
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-8 gap-2">
              <Zap className="size-4" /> Start Free Trial <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
