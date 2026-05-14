import { Check, Circle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Roadmap — Diyaa AI",
  description: "See what we're building next. Public roadmap for Diyaa AI.",
};

const ROADMAP = [
  {
    quarter: "Shipped (May 2026)",
    status: "done",
    items: [
      "5 AI specialist agents (Strategist, Copywriter, Designer, Analyst, Engagement Manager)",
      "Multi-platform publishing (Instagram, X, LinkedIn, Facebook, TikTok, YouTube)",
      "Brand voice training from writing samples",
      "Carousel generator with branded slides",
      "15 animated video templates (HyperFrames)",
      "UGC video pipeline (HeyGen + Replicate)",
      "ROI dashboard with UTM tracking",
      "Performance learning loop",
      "Competitor monitoring + auto counter-posts",
      "White-label client portals",
      "Bulk client onboarding",
      "Auto-onboarding from website URL",
      "5-dimensional content quality gate",
      "Hindi, Tamil, Telugu, Marathi language support",
    ],
  },
  {
    quarter: "Q3 2026 (Jul-Sep)",
    status: "in-progress",
    items: [
      "TikTok Commerce integration (product listings, sales tracking)",
      "Instagram Instants support (disappearing Close Friends posts)",
      "WhatsApp Business integration",
      "AI-powered A/B testing (auto-pick winners)",
      "Advanced email marketing flows (drip campaigns)",
      "Shopify integration (product → post pipeline)",
      "Custom AI model fine-tuning per brand",
      "Mobile app (iOS + Android)",
    ],
  },
  {
    quarter: "Q4 2026 (Oct-Dec)",
    status: "planned",
    items: [
      "Paid ads management (Meta Ads, Google Ads)",
      "Influencer discovery + outreach automation",
      "Multi-language content calendar",
      "Advanced reporting with PDF export",
      "Zapier / Make integration",
      "API for custom integrations",
      "SOC 2 Type II certification",
      "Enterprise SSO (SAML/OIDC)",
    ],
  },
  {
    quarter: "2027",
    status: "planned",
    items: [
      "AI-generated product photography",
      "Podcast → social clips pipeline",
      "Blog → social repurposing",
      "Customer review → testimonial post automation",
      "Multi-brand dashboard for agencies (50+ clients)",
      "On-premise deployment option",
    ],
  },
];

const STATUS_CONFIG = {
  done: { icon: Check, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Shipped" },
  "in-progress": { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "In Progress" },
  planned: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted", label: "Planned" },
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Public Roadmap</h1>
          <p className="text-lg text-muted-foreground">
            What we&apos;ve shipped, what we&apos;re building, and where we&apos;re headed.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Have a feature request? Email <a href="mailto:feedback@diyaa.ai" className="underline">feedback@diyaa.ai</a>
          </p>
        </div>

        <div className="space-y-12">
          {ROADMAP.map((section) => {
            const config = STATUS_CONFIG[section.status as keyof typeof STATUS_CONFIG];
            const Icon = config.icon;
            return (
              <div key={section.quarter}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`size-8 rounded-full ${config.bg} flex items-center justify-center`}>
                    <Icon className={`size-4 ${config.color}`} />
                  </div>
                  <h2 className="text-xl font-bold">{section.quarter}</h2>
                  <Badge variant="secondary" className="text-xs">{config.label}</Badge>
                </div>
                <ul className="space-y-2 pl-11">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Icon className={`size-3.5 ${config.color} shrink-0 mt-1`} />
                      <span className={section.status === "done" ? "text-muted-foreground" : ""}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
