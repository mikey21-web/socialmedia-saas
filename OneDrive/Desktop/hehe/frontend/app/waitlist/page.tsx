"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{ position: number }>("/waitlist/join", {
        email: email.trim(),
        name: name.trim() || undefined,
      });
      setPosition(res.data.position);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <span className="font-bold text-lg">Diyaa AI</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full text-center">
          {submitted ? (
            <div className="space-y-6">
              <div className="mx-auto size-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="size-8 text-emerald-500" />
              </div>
              <h1 className="text-3xl font-bold">You&apos;re on the list!</h1>
              <p className="text-muted-foreground text-lg">
                {position ? `You're #${position} in line.` : "We'll notify you when we launch."}
              </p>
              <div className="bg-card border border-border rounded-xl p-6 text-left space-y-3">
                <p className="font-semibold text-sm">While you wait:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    Share with a friend to move up the list
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    Follow us on X for updates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    Read our case studies to see what&apos;s possible
                  </li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center">
                <Link href="/case-studies/salon">
                  <Button variant="outline" size="sm">Read Case Studies</Button>
                </Link>
                <Link href="/landing">
                  <Button variant="ghost" size="sm">Back to Home</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-medium text-violet-500 bg-violet-500/10 px-3 py-1.5 rounded-full mb-6">
                  <Sparkles className="size-3" />
                  Launching June 2026
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  Get early access
                </h1>
                <p className="text-lg text-muted-foreground">
                  Be the first to try Diyaa AI. Early access members get 30% off for life + priority onboarding.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                />
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 flex-1"
                  />
                  <Button type="submit" disabled={loading || !email.trim()} className="h-12 px-6 gap-2">
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                    Join
                  </Button>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </form>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500" /> No spam
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500" /> 30% off for life
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500" /> Priority access
                </span>
              </div>

              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/signin" className="underline hover:text-foreground">Sign in</Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
