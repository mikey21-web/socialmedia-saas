"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart2,
  Brain,
  Image as ImageIcon,
  MessageSquare,
  Pen,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  TrendingUp,
  Globe,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const specialists = [
  {
    name: "AI Strategist",
    icon: Brain,
    color: "from-blue-500/20 to-blue-500/5 text-blue-500 border-blue-500/20",
    description: "Architects 90-day content pillars and tailored campaigns based on your industry and audience.",
  },
  {
    name: "Master Copywriter",
    icon: Pen,
    color: "from-emerald-500/20 to-emerald-500/5 text-emerald-500 border-emerald-500/20",
    description: "Crafts high-converting posts in your exact brand voice with dynamic A/B testing variations.",
  },
  {
    name: "Creative Designer",
    icon: ImageIcon,
    color: "from-purple-500/20 to-purple-500/5 text-purple-500 border-purple-500/20",
    description: "Generates stunning visuals, carousels, and thumbnails that stop the scroll.",
  },
  {
    name: "Data Analyst",
    icon: BarChart2,
    color: "from-orange-500/20 to-orange-500/5 text-orange-500 border-orange-500/20",
    description: "Uncovers winning patterns and delivers actionable insights to scale your growth.",
  },
  {
    name: "Engagement Manager",
    icon: MessageSquare,
    color: "from-pink-500/20 to-pink-500/5 text-pink-500 border-pink-500/20",
    description: "Interacts with your community 24/7, turning comments and DMs into loyal customers.",
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
  { feature: "Analytics Reports", agency: "Monthly PDF", ai: "Real-time", diy: "Manual" },
  { feature: "Engagement Mgmt", agency: "₹15,000+/month", ai: "Included", diy: "You do it" },
  { feature: "Available Hours", agency: "9-6 weekdays", ai: "24/7/365", diy: "Your time" },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-violet-900/20 via-background to-background"></div>
      <div className="fixed inset-0 -z-10 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
      
      {/* Blur Orbs */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[128px] -z-10"></div>
      <div className="absolute top-1/4 left-0 -translate-x-1/2 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px] -z-10"></div>

      {/* Nav */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 border-b border-border/40 bg-background/60 backdrop-blur-xl z-50"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="size-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Diyaa AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Log in
            </Link>
            <Link href="/signin">
              <Button className="rounded-full px-6 bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xl hover:shadow-foreground/10">
                Start Free Trial <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="px-6 py-20 md:py-32 relative">
          <motion.div 
            className="max-w-5xl mx-auto text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="flex justify-center mb-8">
              <Badge variant="outline" className="rounded-full px-4 py-1.5 border-violet-500/30 bg-violet-500/10 text-violet-500 backdrop-blur-md">
                <Sparkles className="size-3.5 mr-2" />
                <span className="text-sm font-medium">The Future of Social Media Management</span>
              </Badge>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[1.1] mb-8">
              Replace Your Marketing <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-500 via-fuchsia-500 to-pink-500 animate-gradient-x">
                Agency with AI
              </span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Hire 5 specialized AI experts that work 24/7 to plan, create, design, post, and engage. Scale your brand for a fraction of the cost.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signin">
                <Button size="lg" className="rounded-full h-14 px-8 text-base bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-xl shadow-violet-500/25 transition-all hover:scale-105 active:scale-95">
                  <Zap className="size-5 mr-2" /> Get Started for Free
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base backdrop-blur-md border-border/50 hover:bg-muted/50 transition-all">
                <PlayCircle className="size-5 mr-2" /> Watch Demo
              </Button>
            </motion.div>

            <motion.div variants={fadeIn} className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" /> No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" /> 14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" /> Cancel anytime
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Dashboard Preview (Abstracted) */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="px-6 pb-32"
        >
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl md:rounded-[2.5rem] border border-border/50 bg-background/40 backdrop-blur-2xl shadow-2xl p-4 md:p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-violet-500/5 to-fuchsia-500/5"></div>
              {/* Fake UI mockup */}
              <div className="relative rounded-xl md:rounded-2xl border border-border/50 bg-card overflow-hidden flex flex-col h-[400px] md:h-[600px] shadow-sm">
                <div className="h-14 border-b border-border/50 flex items-center px-6 gap-4 bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="size-3 rounded-full bg-red-500/80"></div>
                    <div className="size-3 rounded-full bg-yellow-500/80"></div>
                    <div className="size-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="h-6 w-64 bg-background rounded-md border border-border/50 flex items-center px-3">
                    <div className="w-4 h-4 rounded-full bg-violet-500/20 mr-2"></div>
                    <div className="h-2 w-32 bg-muted-foreground/20 rounded-full"></div>
                  </div>
                </div>
                <div className="flex-1 flex p-6 gap-6">
                  {/* Sidebar */}
                  <div className="hidden md:flex flex-col gap-4 w-48 border-r border-border/50 pr-6">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`h-8 rounded-md ${i === 1 ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-muted/50'}`}></div>
                    ))}
                  </div>
                  {/* Content */}
                  <div className="flex-1 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                      <div className="h-8 w-48 bg-muted rounded-md"></div>
                      <div className="h-8 w-24 bg-violet-500/20 rounded-md"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted/30 rounded-xl border border-border/50"></div>
                      ))}
                    </div>
                    <div className="flex-1 bg-muted/20 rounded-xl border border-border/50"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* The Team / Specialists - Bento Grid */}
        <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Meet Your AI Marketing Team</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Stop juggling tools and freelancers. Get a unified team of AI agents that understand your brand perfectly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specialists.map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-border transition-all hover:shadow-lg group">
                    <CardContent className="p-8 relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-bl ${s.color.split(' ')[0]} ${s.color.split(' ')[1]} rounded-bl-[100px] -z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>
                      <div className={`inline-flex items-center justify-center size-14 rounded-2xl bg-linear-to-br ${s.color} border mb-6 shadow-sm`}>
                        <s.icon className="size-6" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{s.name}</h3>
                      <p className="text-muted-foreground leading-relaxed">{s.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats/Social Proof */}
        <section className="py-24 px-6 border-y border-border/40 bg-muted/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
          <div className="max-w-6xl mx-auto relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
              {[
                { label: "Hours Saved/Mo", value: "120+", icon: TrendingUp },
                { label: "Cost Reduction", value: "85%", icon: BarChart2 },
                { label: "Platforms", value: "All Major", icon: Globe },
                { label: "Active Brands", value: "2,000+", icon: Users },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center space-y-2">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <stat.icon className="size-5 text-primary" />
                  </div>
                  <h4 className="text-4xl md:text-5xl font-black text-foreground">{stat.value}</h4>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">The Unfair Advantage</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how an AI agency stacks up against traditional methods.
              </p>
            </div>
            
            <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-6 md:p-8 font-semibold text-muted-foreground w-1/4 border-b border-border/50">Features</th>
                      <th className="p-6 md:p-8 font-semibold text-muted-foreground text-center w-1/4 border-b border-border/50">Traditional Agency</th>
                      <th className="p-6 md:p-8 font-bold text-center w-1/4 border-b-2 border-primary bg-primary/5 relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-violet-500 to-fuchsia-500"></div>
                        <span className="flex items-center justify-center gap-2 text-lg text-primary">
                          <Zap className="size-5" /> Diyaa AI
                        </span>
                      </th>
                      <th className="p-6 md:p-8 font-semibold text-muted-foreground text-center w-1/4 border-b border-border/50">DIY Tools</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {comparison.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/20 transition-colors">
                        <td className="p-6 font-medium">{row.feature}</td>
                        <td className="p-6 text-center text-muted-foreground">{row.agency}</td>
                        <td className="p-6 text-center font-bold text-foreground bg-primary/5">{row.ai}</td>
                        <td className="p-6 text-center text-muted-foreground">{row.diy}</td>
                      </tr>
                    ))}
                    <tr className="hover:bg-muted/20 transition-colors bg-muted/10 font-medium">
                      <td className="p-6 text-lg">Total Cost</td>
                      <td className="p-6 text-center text-lg text-muted-foreground">₹80,000 - 2L/mo</td>
                      <td className="p-6 text-center text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-violet-500 to-fuchsia-500 bg-primary/5">₹2,999/mo</td>
                      <td className="p-6 text-center text-lg text-muted-foreground">Free + Your Time</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-[2.5rem] relative overflow-hidden border border-violet-500/20 bg-card p-10 md:p-20 text-center shadow-2xl">
              <div className="absolute inset-0 bg-linear-to-br from-violet-600/20 via-fuchsia-600/20 to-orange-500/20 opacity-50 mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
              
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Ready to fire your agency?</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                  Join thousands of forward-thinking brands automating their growth with Diyaa AI. Setup takes less than 10 minutes.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/signin">
                    <Button size="lg" className="rounded-full h-14 px-10 text-base bg-foreground text-background hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95 shadow-xl">
                      Start 14-Day Free Trial
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" variant="outline" className="rounded-full h-14 px-10 text-base bg-background/50 backdrop-blur-md border-border hover:bg-background/80 transition-all">
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="size-8 rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="size-4 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">Diyaa AI</span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-xs">
                The world's first fully autonomous AI marketing agency for modern brands.
              </p>
              <div className="flex items-center gap-4">
                {/* Social icons could go here */}
                <div className="size-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">
                  <svg className="size-5 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </div>
                <div className="size-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">
                  <svg className="size-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </div>
                <div className="size-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">
                  <svg className="size-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Changelog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Case Studies</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">API Docs</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Partners</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Diyaa AI Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
