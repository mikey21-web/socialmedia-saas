"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, X, Pencil, RefreshCw, MessageSquare, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformBadge, type Platform } from "@/components/platform-badge";
import { WhyThisPost } from "./WhyThisPost";
import type { InboxPost } from "@/store/inbox";
import { cn } from "@/lib/utils";

interface InboxCardProps {
  post: InboxPost;
  selected: boolean;
  onSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (post: InboxPost) => void;
  onRegenerate: (id: string) => void;
  onRefine: (id: string) => void;
  onSendEmail: (post: InboxPost) => void;
}

const AGENT_LABELS: Record<string, string> = {
  content_agent: "Content Agent",
  trend_agent: "Trend Agent",
  user: "Manual",
};

export function InboxCard({
  post,
  selected,
  onSelect,
  onApprove,
  onReject,
  onEdit,
  onRegenerate,
  onRefine,
  onSendEmail,
}: InboxCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isReactive = post.generatedBy === "trend_agent";
  const userEdited = post.generationContext?.userEdited;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <Card
      className={cn(
        "p-4 transition-colors",
        isReactive && "border-amber-500/30",
        userEdited && "border-blue-500/30",
        selected && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(post.id)}
          className="mt-1 shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "size-2 rounded-full shrink-0",
                isReactive ? "bg-amber-400" : userEdited ? "bg-blue-400" : "bg-emerald-400"
              )}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {AGENT_LABELS[post.generatedBy ?? ""] ?? post.generatedBy ?? "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {post.platforms.map((platform) => (
              <PlatformBadge key={platform} platform={platform as Platform} showLabel={false} className="scale-90" />
            ))}
            {userEdited && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/25">
                Edited
              </span>
            )}
          </div>

          <p className="text-sm font-medium mt-1">{post.title}</p>
          <p className={cn("text-sm text-muted-foreground mt-0.5", !expanded && "line-clamp-2")}>
            {post.content}
          </p>
          {post.content.length > 150 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary hover:underline mt-0.5"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}

          {expanded && <WhyThisPost generationContext={post.generationContext} />}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 ml-7 flex-wrap">
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onApprove(post.id)}>
          <Check className="size-3" /> Approve
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={() => onReject(post.id)}>
          <X className="size-3" /> Reject
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => onEdit(post)}>
          <Pencil className="size-3" /> Edit
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => onRegenerate(post.id)}>
          <RefreshCw className="size-3" /> Regenerate
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => onRefine(post.id)}>
          <MessageSquare className="size-3" /> Refine
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => onSendEmail(post)}>
          <Mail className="size-3" /> Email
        </Button>
      </div>
    </Card>
  );
}
