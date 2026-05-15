"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformBadge } from "@/components/platform-badge";
import { api } from "@/lib/api";

interface InboxItem {
  id: string;
  platform: string;
  author: string;
  text: string;
  receivedAt: string;
  unread?: boolean;
}

export function InboxPreview() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => api.get<InboxItem[]>("/inbox?limit=5")
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    load();
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (loading) return <Skeleton className="h-48" />;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">Inbox</p>
        </div>
        <Link href="/inbox" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          Open <ChevronRight className="size-3" />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No new messages.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5 text-sm">
              <PlatformBadge platform={item.platform} showLabel={false} className="shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{item.author}</p>
                <p className="text-xs text-muted-foreground truncate">{item.text}</p>
              </div>
              {item.unread && <span className="size-1.5 rounded-full bg-violet-500 mt-2 shrink-0" />}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
