"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformBadge, type Platform } from "@/components/platform-badge";
import { PostModal } from "@/components/post-modal";
import { useCalendarStore } from "@/store/calendar";
import {
  getDaysInMonth,
  getPostsByDate,
  toDateStr,
  type CalendarDay,
  type PostCalendarItem,
} from "@/lib/calendar";

const STATUS_BAR: Record<PostCalendarItem["status"], string> = {
  draft:             "bg-zinc-500",
  scheduled:         "bg-violet-500",
  approved:          "bg-emerald-500",
  published:         "bg-green-500",
  awaiting_approval: "bg-amber-500",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PLATFORM_COLORS: Record<string, string> = {
  twitter:   "#1d9bf0",
  instagram: "#e1306c",
  linkedin:  "#0a66c2",
  facebook:  "#1877f2",
  youtube:   "#ff0000",
  tiktok:    "#010101",
};

function PostCard({
  post,
  onEdit,
  onDelete,
}: {
  post: PostCalendarItem;
  onEdit: (post: PostCalendarItem) => void;
  onDelete?: (postId: string) => void;
}) {
  const time = post.scheduledAt
    ? format(new Date(post.scheduledAt), "h:mm a")
    : null;
  const primary = post.platforms[0] as Platform | undefined;
  const barColor = STATUS_BAR[post.status];

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("postId", post.id)}
      className="group rounded-md overflow-hidden border border-border/60 bg-card shadow-sm cursor-grab active:cursor-grabbing hover:border-ring transition-colors"
    >
      {/* Colored header bar — Postiz style */}
      <div className={`h-6 px-2 flex items-center justify-between gap-1 ${barColor}`}>
        <div className="flex items-center gap-1 min-w-0">
          {primary && (
            <PlatformBadge
              platform={primary}
              showLabel={false}
              className="scale-75 shrink-0"
            />
          )}
          {post.platforms.length > 1 && (
            <span className="text-[10px] text-white/80">+{post.platforms.length - 1}</span>
          )}
        </div>
        {/* Action buttons — visible on hover */}
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(post); }}
            className="size-4 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <Pencil className="size-2.5" />
          </button>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
              className="size-4 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <Trash2 className="size-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content body */}
      <div className="px-2 py-1.5">
        <p className="text-[11px] font-medium leading-snug line-clamp-2 text-foreground">
          {post.title}
        </p>
        {time && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="size-2.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{time}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DayCell({
  day,
  onAddClick,
  onPostEdit,
  onDrop,
}: {
  day: CalendarDay;
  onAddClick: (day: CalendarDay) => void;
  onPostEdit: (post: PostCalendarItem) => void;
  onDrop: (e: React.DragEvent, date: Date) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const visiblePosts = day.posts.slice(0, 3);
  const overflow = day.posts.length - 3;
  const isPast = day.date < new Date(new Date().setHours(0, 0, 0, 0));
  const isOtherMonth = !day.isCurrentMonth;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { onDrop(e, day.date); setIsDragOver(false); }}
      className={[
        "group relative min-h-[110px] border-b border-r border-border/50 p-1.5 transition-colors",
        isDragOver  ? "bg-violet-500/10 border-violet-500/50" : "",
        isOtherMonth ? "opacity-50" : "",
        isPast && !isOtherMonth
          ? "bg-[repeating-linear-gradient(135deg,transparent,transparent_5px,rgba(255,255,255,0.015)_5px,rgba(255,255,255,0.015)_10px)]"
          : "",
        !isDragOver && !isOtherMonth && !isPast ? "hover:bg-accent/30" : "",
      ].join(" ")}
    >
      {/* Date number */}
      <div className="flex items-start justify-between mb-1">
        <span
          className={[
            "text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full",
            day.isToday
              ? "bg-violet-500 text-white"
              : isOtherMonth
              ? "text-muted-foreground/50"
              : "text-muted-foreground",
          ].join(" ")}
        >
          {day.date.getDate()}
        </span>
      </div>

      {/* Post cards */}
      <div className="space-y-1">
        {visiblePosts.map((post) => (
          <PostCard key={post.id} post={post} onEdit={onPostEdit} />
        ))}
        {overflow > 0 && (
          <p className="text-[10px] text-muted-foreground pl-1">+{overflow} more</p>
        )}
      </div>

      {/* + add button — bottom right, shows on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onAddClick(day); }}
        className="absolute bottom-1.5 right-1.5 size-5 rounded-full bg-muted border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-violet-500 hover:border-violet-500 hover:text-white text-muted-foreground"
      >
        <Plus className="size-3" />
      </button>
    </div>
  );
}

function EditScheduleModal({
  post,
  onClose,
  onSave,
}: {
  post: PostCalendarItem;
  onClose: () => void;
  onSave: (postId: string, scheduledAt: string) => Promise<void>;
}) {
  const [scheduledAt, setScheduledAt] = useState(() => {
    if (!post.scheduledAt) return "";
    const d = new Date(post.scheduledAt);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!scheduledAt) return;
    setSaving(true);
    try {
      await onSave(post.id, new Date(scheduledAt).toISOString());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-1">Reschedule post</h2>
        <p className="text-xs text-muted-foreground truncate mb-4">{post.title}</p>
        <label className="text-xs font-medium text-muted-foreground">New date & time</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !scheduledAt}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const currentDate   = useCalendarStore((s) => s.currentDate);
  const posts         = useCalendarStore((s) => s.posts);
  const loading       = useCalendarStore((s) => s.loading);
  const selectedDate  = useCalendarStore((s) => s.selectedDate);
  const nextMonth     = useCalendarStore((s) => s.nextMonth);
  const prevMonth     = useCalendarStore((s) => s.prevMonth);
  const fetchPosts    = useCalendarStore((s) => s.fetchPosts);
  const reschedulePost = useCalendarStore((s) => s.reschedulePost);
  const setMonth      = useCalendarStore((s) => s.setMonth);
  const selectDate    = useCalendarStore((s) => s.selectDate);
  const selectPost    = useCalendarStore((s) => s.selectPost);

  const [createOpen, setCreateOpen]         = useState(false);
  const [createDate, setCreateDate]         = useState<string | undefined>();
  const [editPost, setEditPost]             = useState<PostCalendarItem | null>(null);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const daysWithPosts: CalendarDay[] = useMemo(() => {
    const days = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    return days.map((d) => ({ ...d, posts: getPostsByDate(posts, d.date) }));
  }, [currentDate, posts]);

  const weeks: CalendarDay[][] = useMemo(() => {
    const rows: CalendarDay[][] = [];
    for (let i = 0; i < daysWithPosts.length; i += 7) rows.push(daysWithPosts.slice(i, i + 7));
    return rows;
  }, [daysWithPosts]);

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData("postId");
    if (postId) await reschedulePost(postId, targetDate);
  };

  const handleAddClick = (day: CalendarDay) => {
    setCreateDate(toDateStr(day.date) + "T09:00");
    selectDate(day.dateStr);
    setCreateOpen(true);
  };

  const handleEditPost = (post: PostCalendarItem) => {
    setEditPost(post);
    selectPost(post);
  };

  const handleSaveEdit = async (postId: string, newScheduledAt: string) => {
    await reschedulePost(postId, new Date(newScheduledAt));
  };

  const totalPosts = posts.length;
  const avgPerWeek = Math.round(totalPosts / Math.max(weeks.length, 1));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="size-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h2 className="text-base font-semibold w-36 text-center">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <button
            onClick={nextMonth}
            className="size-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            onClick={() => setMonth(new Date())}
            className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-accent transition-colors text-muted-foreground"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <span><span className="font-semibold text-foreground">{totalPosts}</span> posts</span>
            <span><span className="font-semibold text-foreground">{avgPerWeek}</span> / week</span>
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => { setCreateDate(undefined); setCreateOpen(true); }}
          >
            <Plus className="size-3.5" />
            New post
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border shrink-0">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground border-r border-border/50 last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground animate-pulse">Loading calendar…</div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day) => (
                <DayCell
                  key={day.dateStr}
                  day={day}
                  onAddClick={handleAddClick}
                  onPostEdit={handleEditPost}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-border shrink-0">
        {(["scheduled", "approved", "published", "awaiting_approval", "draft"] as PostCalendarItem["status"][]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${STATUS_BAR[s]}`} />
            <span className="text-[11px] text-muted-foreground capitalize">{s.replace("_", " ")}</span>
          </div>
        ))}
      </div>

      {/* Modals */}
      <PostModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultDate={createDate}
        onSuccess={() => { fetchPosts(); setCreateOpen(false); }}
      />

      {editPost && (
        <EditScheduleModal
          post={editPost}
          onClose={() => { setEditPost(null); selectPost(null); }}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
