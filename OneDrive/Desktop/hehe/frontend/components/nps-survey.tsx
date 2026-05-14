"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * NPS Survey widget. Shows after 7 days of usage, once per 90 days.
 * Renders as a bottom-right floating card.
 */
export function NpsSurvey() {
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const lastShown = localStorage.getItem("nps_last_shown");
    const signupDate = localStorage.getItem("nps_signup_date");

    if (!signupDate) {
      localStorage.setItem("nps_signup_date", new Date().toISOString());
      return;
    }

    const daysSinceSignup = (Date.now() - new Date(signupDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSignup < 7) return;

    if (lastShown) {
      const daysSinceShown = (Date.now() - new Date(lastShown).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceShown < 90) return;
    }

    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  async function handleSubmit() {
    if (score === null) return;
    try {
      await api.post("/feedback", {
        type: "nps",
        score,
        comment: comment.trim() || undefined,
        page: window.location.pathname,
      });
    } catch {
      // silent fail
    }
    localStorage.setItem("nps_last_shown", new Date().toISOString());
    setSubmitted(true);
    setTimeout(() => setVisible(false), 2000);
  }

  function dismiss() {
    localStorage.setItem("nps_last_shown", new Date().toISOString());
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-card border border-border rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-4 duration-300">
      {submitted ? (
        <div className="text-center py-4">
          <p className="font-semibold text-sm">Thank you for your feedback!</p>
          <p className="text-xs text-muted-foreground mt-1">It helps us improve Diyaa AI.</p>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-semibold">How likely are you to recommend Diyaa AI?</p>
            <button onClick={dismiss} className="text-muted-foreground hover:text-foreground p-0.5">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex gap-1 mb-3">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                onClick={() => setScore(i)}
                className={cn(
                  "flex-1 h-8 rounded text-xs font-medium transition-colors",
                  score === i
                    ? i <= 6 ? "bg-red-500 text-white" : i <= 8 ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                    : "bg-muted hover:bg-muted/80",
                )}
              >
                {i}
              </button>
            ))}
          </div>

          <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
            <span>Not likely</span>
            <span>Very likely</span>
          </div>

          {score !== null && (
            <>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={score <= 6 ? "What could we improve?" : "What do you love most?"}
                className="w-full h-16 p-2 text-xs rounded border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring mb-3"
              />
              <Button size="sm" onClick={handleSubmit} className="w-full text-xs">
                Submit Feedback
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
