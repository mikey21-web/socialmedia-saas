import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "How a Salon Chain Grew Bookings 40% with Diyaa AI",
  description:
    "Priya's 3-location salon chain went from posting twice a month to daily content — without hiring a social media manager.",
};

export default function SalonCaseStudy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-violet-500 bg-violet-500/10 px-3 py-1.5 rounded-full mb-6">
            Case Study · Salon & Beauty
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
            How a 3-Location Salon Chain Grew Bookings 40% in 60 Days
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Priya runs Glow Studio — three salons in Bangalore. She was posting twice a month,
            losing clients to competitors who posted daily. Here&apos;s what changed.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: "Booking increase", value: "40%" },
            { label: "Hours saved/week", value: "18 hrs" },
            { label: "Posts per month", value: "90" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-violet-500">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Story */}
        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">The Problem</h2>
            <p className="text-muted-foreground leading-7">
              Priya was spending 4-5 hours every Sunday trying to plan the week&apos;s content. She&apos;d
              open Canva, stare at a blank template, write something generic, post it, and get 12 likes.
              Meanwhile, a competitor salon two streets away was posting daily transformation videos and
              booking out 3 weeks in advance.
            </p>
            <p className="text-muted-foreground leading-7 mt-4">
              &quot;I knew I needed to be more consistent but I just didn&apos;t have the time or the skill,&quot;
              she says. &quot;I tried hiring a freelancer for ₹15,000 a month but the content didn&apos;t sound
              like me. Clients would ask who was running my Instagram.&quot;
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">The Setup (Day 1)</h2>
            <p className="text-muted-foreground leading-7">
              Priya pasted her website URL into Diyaa AI&apos;s onboarding. In 2 minutes, the AI had
              extracted her brand name, her salon&apos;s tone (warm, professional, results-focused), her
              target audience (women 25-45 in Bangalore), and her primary offer (hair transformations
              and bridal packages).
            </p>
            <p className="text-muted-foreground leading-7 mt-4">
              She then pasted 15 of her best past Instagram captions. The AI analyzed her writing style —
              she uses short sentences, specific before/after language, and almost no hashtags in the
              caption body (she puts them in the first comment). It learned all of this.
            </p>
            <p className="text-muted-foreground leading-7 mt-4">
              Total setup time: 22 minutes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Week 1</h2>
            <p className="text-muted-foreground leading-7">
              The AI Strategist built a 30-day content plan with 5 content pillars:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li><strong>Transformations (40%)</strong> — before/after photos with specific service details</li>
              <li><strong>Education (25%)</strong> — hair care tips, product recommendations</li>
              <li><strong>Behind the scenes (15%)</strong> — team, salon life, training</li>
              <li><strong>Offers (15%)</strong> — seasonal promotions, package deals</li>
              <li><strong>Social proof (5%)</strong> — client testimonials, reviews</li>
            </ul>
            <p className="text-muted-foreground leading-7 mt-4">
              The Copywriter generated 7 posts for the first week. Priya reviewed them in 15 minutes,
              approved 6 as-is, and edited one to add a specific client name. All 7 were scheduled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">The Results (Day 60)</h2>
            <div className="space-y-4">
              {[
                { metric: "Instagram reach", before: "~800/month", after: "~6,200/month" },
                { metric: "Profile visits", before: "~120/month", after: "~890/month" },
                { metric: "Booking inquiries via DM", before: "3-4/month", after: "22/month" },
                { metric: "Bookings attributed to Instagram", before: "~5/month", after: "~28/month" },
                { metric: "Time spent on social media", before: "18 hrs/week", after: "45 min/week" },
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
            <h2 className="text-2xl font-bold mb-4">What Made the Difference</h2>
            <div className="space-y-4">
              {[
                "Consistency — 3 posts per day, every day, without Priya thinking about it",
                "Voice — the content sounds like Priya, not like a generic agency",
                "Specificity — 'Balayage + toner, 3.5 hours, ₹4,500' beats 'beautiful hair transformation'",
                "Timing — posts go out at 9am, 1pm, and 7pm when her audience is most active",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">{point}</p>
                </div>
              ))}
            </div>
          </section>

          <blockquote className="border-l-4 border-violet-500 pl-6 py-2">
            <p className="text-lg italic text-foreground">
              &quot;I used to dread Sunday content planning. Now I spend 45 minutes a week approving posts
              that already sound like me. My bookings are up 40% and I haven&apos;t hired anyone.&quot;
            </p>
            <footer className="mt-3 text-sm text-muted-foreground">
              — Priya S., Founder, Glow Studio (Bangalore)
            </footer>
          </blockquote>
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 bg-card border border-border rounded-2xl text-center">
          <h3 className="text-2xl font-bold mb-3">Run a salon or beauty business?</h3>
          <p className="text-muted-foreground mb-6">
            Set up in 10 minutes. Your first week of content is ready tonight.
          </p>
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-8">
              Start Free Trial <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
