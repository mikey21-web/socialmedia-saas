import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "How a Real Estate Agent Got 12 Qualified Leads/Month from LinkedIn",
  description:
    "Rahul, an independent real estate agent in Hyderabad, went from zero social presence to 12 qualified leads per month using Diyaa AI.",
};

export default function RealEstateCaseStudy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full mb-6">
            Case Study · Real Estate
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
            12 Qualified Leads Per Month from LinkedIn — Without Paid Ads
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Rahul is an independent real estate agent in Hyderabad. He was spending ₹25,000/month on
            99acres listings and getting 2-3 leads. LinkedIn changed everything.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: "LinkedIn leads/month", value: "12" },
            { label: "Cost per lead", value: "₹250" },
            { label: "Deals closed (90 days)", value: "3" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-500">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">The Problem</h2>
            <p className="text-muted-foreground leading-7">
              Rahul was spending ₹25,000/month on property listing portals and getting 2-3 leads,
              most of which were tire-kickers. His conversion rate was under 5%. He had a LinkedIn
              profile with 340 connections and had never posted anything.
            </p>
            <p className="text-muted-foreground leading-7 mt-4">
              &quot;I knew LinkedIn was where the serious buyers were — IT professionals, NRIs, people
              actually looking to invest. But I didn&apos;t know what to post. I&apos;m not a writer.&quot;
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">The Content Strategy</h2>
            <p className="text-muted-foreground leading-7">
              Diyaa AI&apos;s Strategist identified that real estate buyers on LinkedIn respond to
              expertise, not listings. The strategy was built around three content pillars:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-muted-foreground mt-4">
              <li>
                <strong>Market intelligence (40%).</strong> &quot;Kokapet prices are up 18% YoY. Here&apos;s
                why and what it means for buyers.&quot; Data-driven, specific, authoritative.
              </li>
              <li>
                <strong>Buyer education (35%).</strong> &quot;5 things nobody tells you about buying a
                flat in Hyderabad.&quot; Practical, honest, builds trust.
              </li>
              <li>
                <strong>Deal stories (25%).</strong> &quot;My client wanted a 3BHK under ₹80L in
                Gachibowli. Here&apos;s what we found and what we passed on.&quot; Real, specific, shows
                Rahul&apos;s judgment.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">The Execution</h2>
            <p className="text-muted-foreground leading-7">
              The AI generated 1 LinkedIn post per day — medium length (300-500 words), authoritative
              tone, specific numbers, no generic real estate clichés. Rahul reviewed each post in
              2-3 minutes, occasionally adding a specific client anecdote or local detail.
            </p>
            <p className="text-muted-foreground leading-7 mt-4">
              The Carousel generator created weekly &quot;Neighbourhood Spotlight&quot; carousels — 7 slides
              covering price trends, infrastructure, schools, commute times, and Rahul&apos;s personal
              recommendation. These became his most-shared content.
            </p>
            <p className="text-muted-foreground leading-7 mt-4">
              The Engagement Manager drafted replies to every comment within 2 hours. When someone
              asked &quot;what&apos;s the best area for ₹60L budget?&quot;, the AI drafted a specific, helpful
              reply that Rahul approved in 30 seconds.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Results at 90 Days</h2>
            <div className="space-y-4">
              {[
                { metric: "LinkedIn connections", before: "340", after: "2,100" },
                { metric: "Post impressions/month", before: "~200", after: "~28,000" },
                { metric: "Inbound leads/month", before: "2-3 (paid portals)", after: "12 (organic LinkedIn)" },
                { metric: "Lead quality (serious buyers)", before: "~5%", after: "~65%" },
                { metric: "Cost per lead", before: "₹8,300", after: "₹250" },
                { metric: "Deals closed", before: "1 in 90 days", after: "3 in 90 days" },
              ].map((row) => (
                <div key={row.metric} className="flex items-center justify-between py-3 border-b border-border/50">
                  <span className="text-sm font-medium">{row.metric}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{row.before}</span>
                    <ArrowRight className="size-3 text-muted-foreground" />
                    <span className="text-emerald-500 font-semibold">{row.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Why It Worked</h2>
            <div className="space-y-3">
              {[
                "Consistency — 1 post every day, never missed",
                "Specificity — real numbers, real areas, real prices (not vague market commentary)",
                "Expertise positioning — buyers came to Rahul because they trusted his judgment",
                "Fast engagement — replies within 2 hours kept conversations alive",
                "No paid ads — 100% organic reach",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">{point}</p>
                </div>
              ))}
            </div>
          </section>

          <blockquote className="border-l-4 border-blue-500 pl-6 py-2">
            <p className="text-lg italic text-foreground">
              &quot;I stopped paying ₹25,000 a month for leads that went nowhere. Now I get 12 serious
              buyers a month from LinkedIn for ₹3,000 (the Diyaa AI subscription). The math is obvious.&quot;
            </p>
            <footer className="mt-3 text-sm text-muted-foreground">
              — Rahul K., Independent Real Estate Agent (Hyderabad)
            </footer>
          </blockquote>
        </div>

        <div className="mt-16 p-8 bg-card border border-border rounded-2xl text-center">
          <h3 className="text-2xl font-bold mb-3">Real estate agent or broker?</h3>
          <p className="text-muted-foreground mb-6">
            Build your authority on LinkedIn. Get leads that actually close.
          </p>
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-8 bg-blue-600 hover:bg-blue-500">
              Start Free Trial <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
