"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, MessageSquare, X as XIcon, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface EngagementAction {
  id: string;
  platform: string;
  actionType: string;
  triggerContent: string;
  agentResponse: string;
  sentiment: string;
  intent: string | null;
  status: string;
  createdAt: string;
}

const SENTIMENT_EMOJI: Record<string, string> = {
  positive: "😊",
  neutral: "😐",
  negative: "😡",
};

const FILTERS = ["all", "pending", "sent", "approved", "rejected"] as const;

export default function EngagementInboxPage() {
  const [actions, setActions] = useState<EngagementAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadActions();
  }, [filter]);

  async function loadActions() {
    setLoading(true);
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const r = await api.get("/api/agency/engagement/actions", { params });
      setActions(r.data);
    } finally {
      setLoading(false);
    }
  }

  async function approve(id: string) {
    await api.post(`/api/agency/engagement/approve/${id}`);
    await loadActions();
  }

  async function reject(id: string) {
    await api.post(`/api/agency/engagement/reject/${id}`);
    await loadActions();
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="size-6 text-pink-500" />
          Engagement Inbox
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Review AI-generated replies and manage engagement</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <Filter className="size-4 text-muted-foreground" />
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : actions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No engagement actions found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => (
            <Card key={action.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-xs">{action.platform}</Badge>
                    <Badge variant="secondary" className="text-xs">{action.actionType}</Badge>
                    <span className="text-lg" title={action.sentiment}>
                      {SENTIMENT_EMOJI[action.sentiment] ?? "😐"}
                    </span>
                    {action.intent && (
                      <Badge variant="outline" className="text-[10px] capitalize">{action.intent.replace("_", " ")}</Badge>
                    )}
                  </div>
                  <Badge
                    variant={action.status === "sent" ? "default" : action.status === "pending" ? "secondary" : "outline"}
                    className="capitalize text-xs"
                  >
                    {action.status}
                  </Badge>
                </div>

                {/* Incoming message */}
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Incoming:</p>
                  <p className="text-sm">{action.triggerContent}</p>
                </div>

                {/* AI Response */}
                <div className="rounded-md bg-primary/5 border border-primary/10 p-3">
                  <p className="text-xs font-medium text-primary/60 mb-1">AI Reply:</p>
                  <p className="text-sm">{action.agentResponse}</p>
                </div>

                {/* Actions */}
                {action.status === "pending" && (
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => reject(action.id)} className="gap-1 text-destructive">
                      <XIcon className="size-3" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => approve(action.id)} className="gap-1">
                      <Check className="size-3" /> Approve & Send
                    </Button>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground">
                  {new Date(action.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
