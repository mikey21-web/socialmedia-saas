"use client";
import { useEffect, useState } from "react";
import { Bot, Calendar, Flame, MessageSquare, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

interface Activity {
  id: string;
  agent: string;
  action: string;
  at: string;
}

const AGENT_ICON: Record<string, React.ElementType> = {
  "content-creator": Bot,
  "scheduler":       Calendar,
  "trend-spotter":   Flame,
  "engagement":      MessageSquare,
  "approval":        CheckCircle2,
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function ActivityFeed() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => api.get<Activity[]>("/dashboard/activity")
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    load();
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (loading) return <Skeleton className="h-64" />;

  return (
    <Card className="p-4">
      <p className="text-sm font-medium mb-3">Activity</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Agents are idle. Activity shows up here as soon as they run.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const Icon = AGENT_ICON[item.agent] ?? Bot;
            return (
              <li key={item.id} className="flex items-start gap-2.5 text-sm">
                <Icon className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <span className="flex-1">{item.action}</span>
                <span className="text-xs text-muted-foreground shrink-0">{relativeTime(item.at)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
