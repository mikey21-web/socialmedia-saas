import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "How a Restaurant Filled Tables on Slow Nights with Diyaa AI",
  description:
    "Arjun's restaurant in Mumbai used AI-generated content to turn Tuesday nights from 30% occupancy to 85% in 45 days.",
};

export default function RestaurantCaseStudy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full mb-6">
            Case Study · Restaurant & F&B
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
            From 30% to 85% Occupancy on Slow Nights — in 45 Days
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Arjun runs Spice Garden, a 60-cover North Indian restaurant in Bandra, Mumbai. Tuesday and
            Wednesday nights were killing his margins. Here&apos;s how he fixed it with content.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: "Tuesday occupancy", value: "85%" },
            { label: "Table bookings via Instagram", value: "34/mo" },
            { label: "Content time saved", value: "15 hrs/wk" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-amber-500">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">The Problem</h2>
            <p className="text-muted-foreground leading-7">
              Spice Garden was full on Friday and Saturday. Tuesday and Wednesday? 30% occupancy.
              Arjun was running newspaper ads (₹8,000/month, zero measurable return) and had tried
              Zomato promotions (expensive, brought price-sensitive customers who never came back).
            </p>
            <p className="text-muted-foreground leading-7 mt-4">
              His Instagram had 1,200 followers and he posted maybe twice a month — usually a blurry
              photo of a dish with &quot;Come visit us!&quot; as the caption. He knew it wasn&apos;t working but
              didn&apos;t know what to do differently.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">The Strategy</h2>
            <p className="text-muted-foreground leading-7">
              Diyaa AI&apos;s Strategist identified the core problem: Arjun was posting about the restaurant,
              not for his audience. The AI built a content strategy around three insights:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-muted-foreground mt-4">
              <li>
                <strong>Tuesday = date night opportunity.</strong> The AI created a &quot;Tuesday Date Night&quot;
                content series — specific dishes, the ambiance, the experience. Not &quot;come visit us&quot;
                but &quot;here&apos;s what your Tuesday evening looks like.&quot;
              </li>
              <li>
                <strong>Food content that makes people hungry.</strong> The Copywriter learned to write
                captions with sensory details: &quot;Slow-cooked for 6 hours. The lamb falls off the bone.
                Available Tuesday-Thursday only.&quot;
              </li>
              <li>
                <strong>Scarcity and urgency.</strong> &quot;8 tables left for Tuesday evening. Link in bio
                to book.&quot; Real scarcity, not manufactured.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">The Content Mix</h2>
            <p className="text-muted-foreground leading-7">
              The AI generated 3 posts per day across Instagram and Facebook:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li>Morning: Behind-the-scenes prep (chef, fresh ingredients, mise en place)</li>
              <li>Afternoon: Dish spotlight with specific details and price</li>
              <li>Evening: Table availability + booking link</li>
            </ul>
            <p className="text-muted-foreground leading-7 mt-4">
              The Carousel generator created weekly &quot;This Week&apos;s Specials&quot; carousels — 5 slides,
              one dish per slide, with the price and a description that made you want to order it.
              These became Arjun&apos;s highest-performing posts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Results at Day 45</h2>
            <div className="space-y-4">
              {[
                { metric: "Tuesday occupancy", before: "30%", after: "85%" },
                { metric: "Wednesday occupancy", before: "35%", after: "72%" },
                { metric: "Instagram followers", before: "1,200", after: "3,800" },
                { metric: "Table bookings via Instagram", before: "2-3/month", after: "34/month" },
                { metric: "Monthly revenue (Tue+Wed)", before: "₹1.8L", after: "₹4.2L" },
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
            <h2 className="text-2xl font-bold mb-4">What Arjun Stopped Doing</h2>
            <div className="space-y-3">
              {[
                "Newspaper ads (₹8,000/month → ₹0)",
                "Zomato promotions (margin-destroying → stopped)",
                "Generic 'Come visit us' captions",
                "Posting twice a month",
                "Spending Sunday evenings writing captions",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">{point}</p>
                </div>
              ))}
            </div>
          </section>

          <blockquote className="border-l-4 border-amber-500 pl-6 py-2">
            <p className="text-lg italic text-foreground">
              &quot;Tuesday used to be the night I dreaded. Now it&apos;s fully booked by Sunday. The content
              sounds like me — specific, warm, about the food. Not like a marketing agency wrote it.&quot;
            </p>
            <footer className="mt-3 text-sm text-muted-foreground">
              — Arjun M., Owner, Spice Garden (Bandra, Mumbai)
            </footer>
          </blockquote>
        </div>

        <div className="mt-16 p-8 bg-card border border-border rounded-2xl text-center">
          <h3 className="text-2xl font-bold mb-3">Run a restaurant or café?</h3>
          <p className="text-muted-foreground mb-6">
            Fill your slow nights with content that makes people hungry.
          </p>
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-8 bg-amber-500 hover:bg-amber-400 text-black">
              Start Free Trial <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
