"use client";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { PostModal } from "@/components/post-modal";

export function QuickActions() {
  return (
    <div className="flex items-center gap-2">
      <PostModal
        trigger={
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 h-9 text-sm font-medium hover:opacity-90">
            <span className="text-sm">+</span>
            New post
          </button>
        }
      />
      <Link
        href="/agency/strategy?action=generate-week"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 h-9 text-sm font-medium hover:bg-muted"
      >
        <Sparkles className="size-3.5 text-violet-500" />
        Generate week
      </Link>
    </div>
  );
}
