"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlatformBadge, type Platform } from "@/components/platform-badge";
import { PostModal } from "@/components/post-modal";
import { useCalendarStore } from "@/store/calendar";
import {
  getDaysInMonth,
  getPostsByDate,
  addMonths,
  toDateStr,
  type CalendarDay,
  type PostCalendarItem,
} from "@/lib/calendar";

const STATUS_COLORS: Record<PostCalendarItem['status'], string> = {
  draft: "border-gray-400 bg-gray-500/10",
  scheduled: "border-blue-500 bg-blue-500/10",
  approved: "border-emerald-500 bg-emerald-500/10",
  published: "border-green-500 bg-green-500/10",
  awaiting_approval: "border-amber-500 bg-amber-500/10",
};

const STATUS_LABELS: Record<PostCalendarItem['status'], string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  approved: "Approved",
  published: "Published",
  awaiting_approval: "Awaiting",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function PostCard({ post, onDragStart }: { post: PostCalendarItem; onDragStart: (postId: string) => void }) {
  const time = post.scheduledAt ? format(new Date(post.scheduledAt), "h:mm a") : "";
  const platform = post.platforms[0] as Platform | undefined;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("postId", post.id);
        onDragStart(post.id);
      }}
      className={`cursor-grab rounded border px-2 py-1 text-xs transition-opacity hover:opacity-80 ${STATUS_COLORS[post.status]}`}
    >
      <div className="flex items-center gap-1">
        {platform && <PlatformBadge platform={platform} showLabel={false} className="scale-75" />}
        <span className="font-medium">{STATUS_LABELS[post.status]}</span>
      </div>
      <div className="truncate font-medium">{post.title}</div>
      {time && <div className="text-muted-foreground">{time}</div>}
    </div>
  );
}

function DayCell({
  day,
  onDragOver,
  onDrop,
  onClick,
  onPostClick,
}: {
  day: CalendarDay;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  onPostClick: (post: PostCalendarItem) => void;
}) {
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);
  const visiblePosts = day.posts.slice(0, 3);
  const remainingCount = day.posts.length - 3;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDrop={(e) => {
        onDrop(e);
        setDraggedPostId(null);
      }}
      onClick={onClick}
      className={`min-h-[120px] cursor-pointer border p-2 transition-colors hover:bg-accent/50 ${
        day.isCurrentMonth ? "" : "bg-muted/30"
      } ${day.isToday ? "bg-accent" : ""}`}
    >
      <div className={`text-sm font-semibold ${day.isToday ? "text-primary" : ""} ${!day.isCurrentMonth ? "text-muted-foreground" : ""}`}>
        {day.date.getDate()}
      </div>
      {day.posts.length > 0 && (
        <div className="mt-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
          {day.posts.length} {day.posts.length === 1 ? "post" : "posts"}
        </div>
      )}
      <div className="mt-1 space-y-1">
        {visiblePosts.map((post) => (
          <div
            key={post.id}
            onClick={(e) => {
              e.stopPropagation();
              onPostClick(post);
            }}
          >
            <PostCard post={post} onDragStart={setDraggedPostId} />
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="text-xs text-muted-foreground">+{remainingCount} more</div>
        )}
      </div>
    </div>
  );
}

function DayModal({
  day,
  open,
  onClose,
  onPostClick,
}: {
  day: CalendarDay;
  open: boolean;
  onClose: () => void;
  onPostClick: (post: PostCalendarItem) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {format(day.date, "MMMM d, yyyy")}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        {day.posts.length === 0 ? (
          <p className="text-muted-foreground">No posts scheduled for this day.</p>
        ) : (
          <div className="space-y-2">
            {day.posts.map((post) => (
              <div
                key={post.id}
                onClick={() => onPostClick(post)}
                className={`cursor-pointer rounded border p-3 ${STATUS_COLORS[post.status]}`}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="size-4 cursor-grab text-muted-foreground" />
                  <span className="text-sm font-medium">{STATUS_LABELS[post.status]}</span>
                  {post.platforms.map((p) => (
                    <PlatformBadge key={p} platform={p as Platform} showLabel={false} />
                  ))}
                </div>
                <div className="mt-1 font-medium">{post.title}</div>
                {post.scheduledAt && (
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(post.scheduledAt), "h:mm a")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EditPostModal({
  post,
  open,
  onClose,
  onSave,
}: {
  post: PostCalendarItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (postId: string, scheduledAt: string) => Promise<void>;
}) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (post?.scheduledAt) {
      const date = new Date(post.scheduledAt);
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      setScheduledAt(localDate.toISOString().slice(0, 16));
    }
  }, [post]);

  if (!open || !post) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(post.id, new Date(scheduledAt).toISOString());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold">Edit Post</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Scheduled Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const currentDate = useCalendarStore((state) => state.currentDate);
  const posts = useCalendarStore((state) => state.posts);
  const loading = useCalendarStore((state) => state.loading);
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const selectedPost = useCalendarStore((state) => state.selectedPost);
  const nextMonth = useCalendarStore((state) => state.nextMonth);
  const prevMonth = useCalendarStore((state) => state.prevMonth);
  const fetchPosts = useCalendarStore((state) => state.fetchPosts);
  const reschedulePost = useCalendarStore((state) => state.reschedulePost);
  const selectDate = useCalendarStore((state) => state.selectDate);
  const selectPost = useCalendarStore((state) => state.selectPost);

  const [createOpen, setCreateOpen] = useState(false);
  const [dayModalDay, setDayModalDay] = useState<CalendarDay | null>(null);
  const [editModalPost, setEditModalPost] = useState<PostCalendarItem | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const days = useMemo(() => {
    return getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const weeks = useMemo(() => {
    const result: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  const daysWithPosts = useMemo(() => {
    return days.map((day) => ({
      ...day,
      posts: getPostsByDate(posts, day.date),
    }));
  }, [days, posts]);

  const weeksWithPosts = useMemo(() => {
    const result: CalendarDay[][] = [];
    for (let i = 0; i < daysWithPosts.length; i += 7) {
      result.push(daysWithPosts.slice(i, i + 7));
    }
    return result;
  }, [daysWithPosts]);

  const postsThisMonth = posts.length;
  const avgPerWeek = Math.round(postsThisMonth / 4);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData("postId");
    if (postId) {
      await reschedulePost(postId, targetDate);
    }
  };

  const handleDayClick = (day: CalendarDay) => {
    setDayModalDay(day);
    selectDate(day.dateStr);
  };

  const handlePostClick = (post: PostCalendarItem) => {
    setEditModalPost(post);
    selectPost(post);
  };

  const handleSaveEdit = async (postId: string, newScheduledAt: string) => {
    await reschedulePost(postId, new Date(newScheduledAt));
    setEditModalPost(null);
    selectPost(null);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Content Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monthly view of scheduled content across all platforms.
          </p>
        </div>
        <PostModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          defaultDate={selectedDate?.slice(0, 16) || undefined}
          onSuccess={() => fetchPosts()}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="min-w-[140px] text-center text-lg font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              useCalendarStore.getState().setMonth(today);
            }}
          >
            <Calendar className="mr-2 size-4" />
            Today
          </Button>
        </div>

        <div className="flex gap-1 border-b bg-muted/50 px-4 py-2 text-center text-sm font-medium">
          {WEEKDAYS.map((day) => (
            <div key={day} className="flex-1">
              {day}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading calendar...</div>
        ) : (
          <div className="divide-y">
            {weeksWithPosts.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 divide-x">
                {week.map((day) => (
                  <DayCell
                    key={day.dateStr}
                    day={day}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day.date)}
                    onClick={() => handleDayClick(day)}
                    onPostClick={handlePostClick}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{postsThisMonth}</span> posts this month
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{avgPerWeek}</span> avg per week
        </div>
      </div>

      <DayModal
        day={dayModalDay || daysWithPosts[0]}
        open={!!dayModalDay}
        onClose={() => {
          setDayModalDay(null);
          selectDate(null);
        }}
        onPostClick={handlePostClick}
      />

      <EditPostModal
        post={editModalPost}
        open={!!editModalPost}
        onClose={() => {
          setEditModalPost(null);
          selectPost(null);
        }}
        onSave={handleSaveEdit}
      />

      <PostModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultDate={selectedDate?.slice(0, 16) || undefined}
        onSuccess={() => fetchPosts()}
      />
    </div>
  );
}