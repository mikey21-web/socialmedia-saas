"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar as BigCalendar, Views, dateFnsLocalizer, type EventProps, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { PlatformBadge, PLATFORM_STYLES, type Platform } from "@/components/platform-badge";
import { CalendarEventModal } from "@/components/calendar-event-modal";
import { PostModal } from "@/components/post-modal";
import { useCalendarStore, type CalendarPost } from "@/store/calendar";

import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type PostEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarPost;
};

function CalendarEvent({ event }: EventProps<PostEvent>) {
  const primaryPlatform = event.resource.platforms[0] ?? "twitter";
  return (
    <div className={`rounded-md border px-2 py-1 text-xs font-medium ${PLATFORM_STYLES[primaryPlatform]}`}>
      {event.title}
    </div>
  );
}

export default function CalendarPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const viewMode = useCalendarStore((state) => state.viewMode);
  const selectedPost = useCalendarStore((state) => state.selectedPost);
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate);
  const setViewMode = useCalendarStore((state) => state.setViewMode);
  const setSelectedPost = useCalendarStore((state) => state.setSelectedPost);

  async function fetchScheduledPosts() {
    setLoading(true);
    try {
      const response = await api.get<{
        posts: Array<{
          id: string;
          title: string;
          content: string;
          status: string;
          scheduledAt: string | null;
          platforms: Array<{ platform: Platform }>;
        }>;
      }>("/posts", {
        params: {
          status: "scheduled",
          limit: 500,
        },
      });

      setPosts(
        response.data.posts
          .filter((post) => Boolean(post.scheduledAt))
          .map((post) => ({
            id: post.id,
            title: post.title,
            content: post.content,
            platforms: post.platforms.map((platform) => platform.platform),
            status: post.status,
            scheduledAt: post.scheduledAt ?? new Date().toISOString(),
          })),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchScheduledPosts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const events = useMemo<PostEvent[]>(
    () =>
      posts.map((post) => {
        const start = new Date(post.scheduledAt);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        return {
          id: post.id,
          title: post.title,
          start,
          end,
          resource: post,
        };
      }),
    [posts],
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A live view of every scheduled post across your publishing queue.
          </p>
        </div>
        <PostModal onSuccess={() => void fetchScheduledPosts()} />
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Scheduled content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Loading calendar...</div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(posts.flatMap((post) => post.platforms))).map((platform) => (
                  <PlatformBadge key={platform} platform={platform} />
                ))}
              </div>

              <div className="calendar-shell">
                <BigCalendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  view={viewMode}
                  onView={(view) => setViewMode(view as View)}
                  views={[Views.MONTH, Views.WEEK, Views.DAY]}
                  selectable
                  popup
                  style={{ height: 760 }}
                  components={{
                    event: CalendarEvent,
                    month: {
                      dateHeader: ({ date, label }) => (
                        <div className="flex items-center justify-between gap-2">
                          <span>{label}</span>
                          <button
                            type="button"
                            className="rounded-full border border-border bg-background/80 p-1 text-muted-foreground transition hover:text-foreground"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setSelectedDate(date.toISOString());
                              setCreateOpen(true);
                            }}
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      ),
                    },
                  }}
                  onSelectEvent={(event) => setSelectedPost(event.resource)}
                  onSelectSlot={(slot) => {
                    setSelectedDate(slot.start.toISOString());
                    setCreateOpen(true);
                  }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CalendarEventModal
        open={Boolean(selectedPost)}
        onClose={() => setSelectedPost(null)}
        post={selectedPost}
      />

      <PostModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultDate={selectedDate ? selectedDate.slice(0, 16) : undefined}
        onSuccess={() => void fetchScheduledPosts()}
      />
    </div>
  );
}
