"use client";

import Link from "next/link";
import { Check, Sparkles, Zap, Building2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "solo",
    name: "Solo",
    price: "₹2,999",
    period: "/month",
    description: "For individual creators and small businesses getting started",
    icon: Sparkles,
    color: "border-border",
    popular: false,
    features: [
      "2 social platforms",
      "30 posts/month",
      "1 brand voice profile",
      "5 carousels/month",
      "50 AI runs/day",
      "Basic analytics",
      "Email support",
    ],
    cta: "Start Free Trial",
    ctaVariant: "outline" as const,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹9,999",
    period: "/month",
    description: "For growing brands that need full AI agency power",
    icon: Zap,
    color: "border-primary ring-2 ring-primary/20",
    popular: true,
    features: [
      "5 social platforms",
      "90 posts/month",
      "3 brand voice profiles",
      "20 carousels/month",
      "200 AI runs/day",
      "Advanced analytics + ROI tracking",
      "Competitor monitoring",
      "Performance learning loop",
      "Priority support",
      "3 team members",
    ],
    cta: "Start Free Trial",
    ctaVariant: "default" as const,
  },
  {
    id: "agency",
    name: "Agency",
    price: "₹19,999",
    period: "/month",
    description: "For agencies managing multiple client brands",
    icon: Building2,
    color: "border-border",
    popular: false,
    features: [
      "5 platforms per client",
      "300 posts/month",
      "10 brand voice profiles",
      "60 carousels/month",
      "1,000 AI runs/day",
      "White-label client portals",
      "5 client accounts",
      "Bulk onboarding (CSV)",
      "Client approval links",
      "Weekly branded reports",
      "10 team members",
      "Dedicated support",
    ],
    cta: "Start Free Trial",
    ctaVariant: "outline" as const,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "₹49,999",
    period: "/month",
    description: "For large organizations with custom needs",
    icon: Crown,
    color: "border-border",
    popular: false,
    features: [
      "Unlimited everything",
      "50 client accounts",
      "White-label portals",
      "Custom integrations",
      "Dedicated account manager",
      "4-hour SLA",
      "Custom AI model training",
      "On-premise option",
      "SSO / SAML",
      "Priority phone support",
    ],
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
  },
];

const FAQ = [
  {
    q: "Is there a free trial?",
    a: "Yes. 14-day free trial on all plans. No credit card required. Cancel anytime.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. Upgrade or downgrade anytime from Settings → Billing. Changes take effect immediately.",
  },
  {
    q: "What happens when I hit my post limit?",
    a: "You'll see a notification. You can upgrade instantly or wait for the next billing cycle to reset.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes. Annual plans get 2 months free (pay for 10, get 12). Contact support to switch.",
  },
  {
    q: "What's included in the free trial?",
    a: "Full Pro plan features for 14 days. All AI agents, all platforms, all analytics. No restrictions.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from the billing portal. You keep access until the end of your billing period.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. AES-256 encryption, SOC 2 practices, GDPR compliant. See our Security page for details.",
  },
  {
    q: "Do you support Indian payment methods?",
    a: "Yes. UPI, credit/debit cards, net banking — all via Stripe India.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <span className="font-bold text-lg">Diyaa AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm text-muted-foreground hover:text-foreground">Log in</Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-full">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free. Upgrade when you grow. No hidden fees, no credit caps, no per-post charges.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full">
            <Check className="size-4" />
            14-day free trial on all plans · No credit card required
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card key={plan.id} className={cn("relative flex flex-col", plan.color)}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-bold">
                      MOST POPULAR
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="size-5 text-primary" />
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.id === "enterprise" ? "mailto:sales@diyaa.ai" : "/signup"}>
                    <Button
                      variant={plan.ctaVariant}
                      className={cn("w-full", plan.popular && "bg-primary text-primary-foreground hover:bg-primary/90")}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison with agencies */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Still cheaper than a freelancer</h2>
          <p className="text-muted-foreground">
            A social media freelancer in India costs ₹15,000-50,000/month. You get 5 AI specialists for ₹2,999.
          </p>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid gap-4">
            {FAQ.map((item) => (
              <div key={item.q} className="border border-border rounded-lg p-5">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
          <p className="text-muted-foreground mb-6">14-day free trial. No credit card. Cancel anytime.</p>
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-8 h-14 text-base">
              <Zap className="size-5 mr-2" /> Start Free Trial
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
