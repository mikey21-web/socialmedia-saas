"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PostModal } from "@/components/post-modal";

type Platform = "twitter" | "instagram" | "linkedin" | "facebook";

interface ScheduledPost {
  id: string;
  title: string;
  platform: Platform;
  time: string;
}

const PLATFORM_COLORS: Record<Platform, string> = {
  twitter:   "bg-sky-500/20 text-sky-400 border border-sky-500/30",
  instagram: "bg-pink-500/20 text-pink-400 border border-pink-500/30",
  linkedin:  "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  facebook:  "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
};

const PLATFORM_DOT: Record<Platform, string> = {
  twitter:   "bg-sky-400",
  instagram: "bg-pink-400",
  linkedin:  "bg-blue-400",
  facebook:  "bg-indigo-400",
};

// Placeholder scheduled posts (keyed by YYYY-MM-DD)
const DEMO_POSTS: Record<string, ScheduledPost[]> = {
  "2026-05-05": [
    { id: "1", title: "Product launch thread", platform: "twitter",   time: "09:00" },
    { id: "2", title: "Behind-the-scenes reel", platform: "instagram", time: "12:00" },
  ],
  "2026-05-08": [
    { id: "3", title: "Founder story",         platform: "linkedin",  time: "08:30" },
  ],
  "2026-05-12": [
    { id: "4", title: "Feature highlight",     platform: "twitter",   time: "11:00" },
    { id: "5", title: "Community post",        platform: "facebook",  time: "15:00" },
    { id: "6", title: "Carousel post",         platform: "instagram", time: "18:00" },
  ],
  "2026-05-15": [
    { id: "7", title: "Weekly roundup",        platform: "linkedin",  time: "09:00" },
    { id: "8", title: "Engagement post",       platform: "twitter",   time: "14:00" },
  ],
  "2026-05-20": [
    { id: "9", title: "Product demo clip",     platform: "instagram", time: "10:00" },
  ],
  "2026-05-26": [
    { id: "10", title: "Case study launch",    platform: "linkedin",  time: "08:00" },
    { id: "11", title: "Teaser post",          platform: "twitter",   time: "17:00" },
  ],
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { year, month } = current;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const monthName = new Date(year, month).toLocaleString("default", { month: "long" });

  function prev() {
    setCurrent(month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
    setSelectedDay(null);
  }
  function next() {
    setCurrent(month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });
    setSelectedDay(null);
  }

  // Build 6-row grid
  const cells: { day: number; thisMonth: boolean; key: string }[] = [];
  for (let i = 0; i < firstDay; i++) {
    const day = daysInPrev - firstDay + 1 + i;
    cells.push({ day, thisMonth: false, key: getKey(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, day) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, thisMonth: true, key: getKey(year, month, d) });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, thisMonth: false, key: getKey(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, d) });
  }

  const selectedPosts = selectedDay ? (DEMO_POSTS[selectedDay] ?? []) : [];

  return (
    <div className="flex h-full">
      {/* Main calendar */}
      <div className="flex-1 p-6 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{monthName} {year}</h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prev}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={next}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <PostModal />
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-xs font-medium text-muted-foreground text-center py-1.5">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 flex-1 border-l border-t border-border rounded-lg overflow-hidden">
          {cells.map(({ day, thisMonth, key }, i) => {
            const posts = DEMO_POSTS[key] ?? [];
            const isToday =
              thisMonth &&
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();
            const isSelected = selectedDay === key;

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : key)}
                className={cn(
                  "border-b border-r border-border p-2 text-left align-top min-h-[90px] transition-colors",
                  "hover:bg-muted/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  !thisMonth && "opacity-30",
                  isSelected && "bg-muted/60",
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-1",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground",
                  )}
                >
                  {day}
                </span>

                {/* Post chips — show up to 2, then +N */}
                <div className="space-y-0.5">
                  {posts.slice(0, 2).map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate",
                        PLATFORM_COLORS[p.platform],
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full shrink-0", PLATFORM_DOT[p.platform])} />
                      <span className="truncate">{p.title}</span>
                    </div>
                  ))}
                  {posts.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1.5">
                      +{posts.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side panel — shown when a day is selected */}
      {selectedDay && (
        <aside className="w-72 shrink-0 border-l border-border p-5 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {new Date(selectedDay + "T00:00:00").toLocaleDateString("default", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedDay(null)}>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>

          {selectedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <p className="text-sm text-muted-foreground">Nothing scheduled</p>
              <PostModal
                trigger={
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Plus className="size-3.5" />
                    Add post
                  </Button>
                }
                defaultDate={selectedDay ?? undefined}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {selectedPosts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-border bg-card p-3 space-y-1.5 hover:border-ring transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full", PLATFORM_DOT[p.platform])} />
                    <span className="text-xs font-medium capitalize text-muted-foreground">
                      {p.platform}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">{p.time}</span>
                  </div>
                  <p className="text-sm font-medium leading-snug">{p.title}</p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    Scheduled
                  </span>
                </div>
              ))}
              <PostModal
                trigger={
                  <Button size="sm" variant="outline" className="w-full gap-1.5 mt-2">
                    <Plus className="size-3.5" />
                    Add to this day
                  </Button>
                }
                defaultDate={selectedDay ?? undefined}
              />
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
