import Link from "next/link";
import { Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About Diyaa AI — The Team Behind Your AI Marketing Agency",
  description: "We're building the future of social media management for Indian SMBs. Meet the team and learn our story.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="size-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="size-5 text-white" />
            </div>
            <span className="font-bold text-2xl">Diyaa AI</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-6">
            We&apos;re building the marketing team every SMB deserves
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Most small businesses in India can&apos;t afford a ₹50,000/month marketing agency.
            But they still need consistent, high-quality content to grow. That&apos;s the gap we&apos;re closing.
          </p>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-4">The Problem We Saw</h2>
            <p className="text-muted-foreground leading-7">
              We talked to 200+ small business owners across India — salon owners, restaurant managers,
              real estate agents, fitness coaches, D2C founders. Every single one said the same thing:
              &quot;I know I need to post consistently on social media. I just don&apos;t have the time or skill.&quot;
            </p>
            <p className="text-muted-foreground leading-7 mt-4">
              They&apos;d tried freelancers (expensive, inconsistent). They&apos;d tried ChatGPT (generic, doesn&apos;t
              sound like them). They&apos;d tried doing it themselves (burned out after 2 weeks). None of it worked.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">What We Built</h2>
            <p className="text-muted-foreground leading-7">
              Diyaa AI is a team of 5 AI specialists that work together to plan, write, design, post,
              and engage — in your exact brand voice, on your schedule, across all your platforms.
              It costs less than a single freelancer and works 24/7.
            </p>
            <p className="text-muted-foreground leading-7 mt-4">
              We&apos;re not another scheduling tool. We&apos;re not another ChatGPT wrapper. We&apos;re a full
              marketing agency compressed into software — with a Boss Agent that reviews every piece
              of content before it goes live, a learning loop that gets smarter every week, and
              revenue tracking that shows you exactly which posts drive real business results.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Our Beliefs</h2>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex gap-3">
                <Zap className="size-5 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-foreground">AI should sound like you, not like AI.</strong> Every output passes a 5-dimensional quality gate. No em-dashes, no corporate buzzwords, no generic openers.</span>
              </li>
              <li className="flex gap-3">
                <Zap className="size-5 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Revenue matters more than vanity metrics.</strong> We track clicks → conversions → revenue. Not just impressions.</span>
              </li>
              <li className="flex gap-3">
                <Zap className="size-5 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Consistency beats creativity.</strong> Posting every day in your voice beats one viral post a month.</span>
              </li>
              <li className="flex gap-3">
                <Zap className="size-5 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Indian SMBs deserve world-class tools at Indian prices.</strong> ₹2,999/month, not $299/month.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Contact</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong>General:</strong> <a href="mailto:hello@diyaa.ai" className="underline">hello@diyaa.ai</a></p>
              <p><strong>Support:</strong> <a href="mailto:support@diyaa.ai" className="underline">support@diyaa.ai</a></p>
              <p><strong>Sales:</strong> <a href="mailto:sales@diyaa.ai" className="underline">sales@diyaa.ai</a></p>
              <p><strong>Security:</strong> <a href="mailto:security@diyaa.ai" className="underline">security@diyaa.ai</a></p>
            </div>
          </section>
        </div>

        <div className="mt-16 text-center p-8 bg-card border border-border rounded-2xl">
          <h3 className="text-2xl font-bold mb-3">Want to try it?</h3>
          <p className="text-muted-foreground mb-6">14-day free trial. Setup takes 10 minutes.</p>
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-8">Start Free Trial</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
