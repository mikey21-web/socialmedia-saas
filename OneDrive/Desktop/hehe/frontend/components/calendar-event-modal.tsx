"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlatformBadge, type Platform } from "@/components/platform-badge";
import type { PostCalendarItem } from "@/lib/calendar";

interface CalendarEventModalProps {
  open: boolean;
  onClose: () => void;
  post: PostCalendarItem | null;
}

export function CalendarEventModal({ open, onClose, post }: CalendarEventModalProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{post?.title ?? "Scheduled post"}</DialogTitle>
        </DialogHeader>

        {post && (
          <div className="space-y-4 text-sm">
            {post.scheduledAt && (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Scheduled time</p>
                <p className="mt-1 font-medium">
                  {new Date(post.scheduledAt).toLocaleString()}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Platforms</p>
              <div className="flex flex-wrap gap-2">
                {post.platforms.map((platform) => (
                  <PlatformBadge key={platform} platform={platform as Platform} />
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <p className="mt-1 font-medium capitalize">{post.status}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
