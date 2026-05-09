"use client";

import Link from "next/link";
import {
  BarChart2,
  Brain,
  Image,
  MessageSquare,
  Pen,
  Zap,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const specialists = [
  {
    name: "Strategist",
    icon: Brain,
    color: "text-blue-500 bg-blue-500/10",
    description: "Creates 90-day content strategies with pillars, campaigns, and posting cadence tailored to your industry.",
  },
  {
    name: "Copywriter",
    icon: Pen,
    color: "text-green-500 bg-green-500/10",
    description: "Writes posts in YOUR brand voice with >80% accuracy. Generates variants for A/B testing across platforms.",
  },
  {
    name: "Designer",
    icon: Image,
    color: "text-purple-500 bg-purple-500/10",
    description: "Creates AI-powered visuals, carousels, and thumbnails matching your brand colors and style.",
  },
  {
    name: "Analyst",
    icon: BarChart2,
    color: "text-orange-500 bg-orange-500/10",
    description: "Delivers weekly performance reports with insights, winning patterns, and competitor analysis.",
  },
  {
    name: "Engagement Manager",
    icon: MessageSquare,
    color: "text-pink-500 bg-pink-500/10",
    description: "Auto-replies to comments and DMs in your brand voice. Classifies intent and sentiment in real-time.",
  },
];

const steps = [
  { num: "01", title: "Onboard", desc: "10-minute setup: brand voice, industry, goals" },
  { num: "02", title: "Strategize", desc: "AI generates your 90-day content plan" },
  { num: "03", title: "Create", desc: "Daily content written and designed in your voice" },
  { num: "04", title: "Engage", desc: "Auto-replies to comments and DMs 24/7" },
  { num: "05", title: "Grow", desc: "Weekly insights optimize your strategy" },
];

const comparison = [
  { feature: "Strategy Planning", agency: "₹15,000+/month", ai: "Included", diy: "You do it" },
  { feature: "Content Creation", agency: "₹20,000+/month", ai: "Included", diy: "You do it" },
  { feature: "Design/Visuals", agency: "₹10,000+/month", ai: "Included", diy: "Canva" },
  { feature: "Analytics Reports", agency: "Monthly PDF", ai: "Real-time + Weekly", diy: "Manual" },
  { feature: "Engagement Mgmt", agency: "₹15,000+/month", ai: "Included", diy: "You do it" },
  { feature: "Available Hours", agency: "9-6 weekdays", ai: "24/7/365", diy: "Your time" },
  { feature: "Total Cost", agency: "₹80,000-2,00,000", ai: "₹2,999-49,999", diy: "Free (your time)" },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-bold text-lg">Diyaa AI</span>
          <div className="flex items-center gap-3">
            <Link href="/signin">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signin">
              <Button size="sm" className="gap-1">
                Start Free Trial <ArrowRight className="size-3" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="size-3 mr-1" /> AI Marketing Agency
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Replace Your Marketing{" "}
            <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              Agency with AI
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            5 AI specialists work on your brand 24/7. Strategy, content, posting, engagement, analytics.{" "}
            <strong>₹2,999–49,999/month</strong> vs. ₹80,000–2 lakh agency cost.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/signin">
              <Button size="lg" className="gap-2 h-12 px-8">
                <Zap className="size-4" /> Start 14-Day Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Specialists */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Meet Your 5 AI Specialists</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            Each specialist is trained on your brand voice and industry best practices.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {specialists.map((s) => (
              <Card key={s.name} className="text-center">
                <CardContent className="pt-6 space-y-3">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${s.color}`}>
                    <s.icon className="size-6" />
                  </div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="text-3xl font-bold text-muted-foreground/30">{step.num}</div>
                <h3 className="font-semibold mt-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">AI Agency vs. Traditional Agency vs. DIY</h2>
          <p className="text-center text-muted-foreground mb-8">See why businesses are switching to AI-powered marketing.</p>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 font-medium">Feature</th>
                  <th className="text-center p-3 font-medium">Traditional Agency</th>
                  <th className="text-center p-3 font-medium bg-primary/5 border-x border-primary/10">
                    <span className="flex items-center justify-center gap-1">
                      <Zap className="size-3 text-yellow-500" /> Diyaa AI
                    </span>
                  </th>
                  <th className="text-center p-3 font-medium">DIY Tools</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-t">
                    <td className="p-3 font-medium">{row.feature}</td>
                    <td className="p-3 text-center text-muted-foreground">{row.agency}</td>
                    <td className="p-3 text-center bg-primary/5 border-x border-primary/10 font-medium">{row.ai}</td>
                    <td className="p-3 text-center text-muted-foreground">{row.diy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground mb-8">
            Replace your ₹80,000/month marketing agency for <strong>₹19,999</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {([
              { name: "Solo", price: "₹2,999", desc: "1 brand, 3 platforms, 60 posts/mo" },
              { name: "Pro", price: "₹9,999", desc: "3 brands, all platforms, 200 posts/mo" },
              { name: "Agency", price: "₹19,999", desc: "10 brands, white-label, 500 posts/mo", popular: true },
              { name: "Enterprise", price: "₹49,999", desc: "Unlimited, dedicated support, SLA" },
            ] as const).map((tier) => (
              <Card key={tier.name} className={"popular" in tier && tier.popular ? "border-primary ring-1 ring-primary" : ""}>
                <CardContent className="pt-6 space-y-3 text-center">
                  {"popular" in tier && tier.popular && <Badge className="mb-2">Most Popular</Badge>}
                  <h3 className="font-semibold">{tier.name}</h3>
                  <p className="text-3xl font-bold">{tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <p className="text-xs text-muted-foreground">{tier.desc}</p>
                  <Link href="/signin">
                    <Button variant={"popular" in tier && tier.popular ? "default" : "outline"} className="w-full mt-2">
                      Start Free Trial
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold">Ready to Replace Your Agency?</h2>
          <p className="text-muted-foreground mt-4">
            Start your 14-day free trial. No credit card required. Your AI marketing team is assembled in 10 minutes.
          </p>
          <Link href="/signin">
            <Button size="lg" className="mt-6 gap-2 h-12 px-8">
              <Zap className="size-4" /> Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 Diyaa AI. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
