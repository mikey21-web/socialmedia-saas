"use client";

import { Star } from "lucide-react";

/**
 * Social proof section for the landing page.
 * Replace placeholder testimonials with real ones as you get customers.
 */

const TESTIMONIALS = [
  {
    name: "Priya S.",
    role: "Salon Owner, Bangalore",
    content: "My bookings are up 40% and I haven't hired anyone. The AI sounds exactly like me.",
    rating: 5,
    avatar: "PS",
  },
  {
    name: "Arjun M.",
    role: "Restaurant Owner, Mumbai",
    content: "Tuesday used to be dead. Now it's fully booked by Sunday. The content is specific, warm, about the food.",
    rating: 5,
    avatar: "AM",
  },
  {
    name: "Rahul K.",
    role: "Real Estate Agent, Hyderabad",
    content: "12 qualified leads a month from LinkedIn for ₹3,000. The math is obvious.",
    rating: 5,
    avatar: "RK",
  },
  {
    name: "Sneha D.",
    role: "D2C Founder, Delhi",
    content: "Replaced a ₹30k/month freelancer. The carousels are better than what she was making.",
    rating: 5,
    avatar: "SD",
  },
  {
    name: "Vikram P.",
    role: "Fitness Coach, Pune",
    content: "I post 3x a day now without thinking about it. My DMs are full of inquiries.",
    rating: 5,
    avatar: "VP",
  },
  {
    name: "Meera R.",
    role: "Agency Owner, Chennai",
    content: "Managing 15 clients with one tool. The white-label portals are a game changer for us.",
    rating: 5,
    avatar: "MR",
  },
];

export function SocialProofSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Loved by businesses across India
          </h2>
          <p className="text-lg text-muted-foreground">
            From salons to SaaS — brands trust Diyaa AI to grow their social presence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-card border border-border rounded-xl p-6 hover:border-border/80 transition-colors"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
