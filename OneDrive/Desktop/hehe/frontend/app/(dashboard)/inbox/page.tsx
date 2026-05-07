"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInboxStore, type InboxPost } from "@/store/inbox";
import { InboxCard } from "@/components/inbox/InboxCard";
import { BulkActionBar } from "@/components/inbox/BulkActionBar";
import { EditModal } from "@/components/inbox/EditModal";
import { RejectionReasonModal } from "@/components/inbox/RejectionReasonModal";
import { RefineFeedback } from "@/components/inbox/RefineFeedback";
import { SendEmailModal } from "@/components/inbox/SendEmailModal";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const FILTERS = [
  { label: "All Awaiting", value: "awaiting_approval" },
  { label: "Approved", value: "approved" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Rejected", value: "rejected" },
];

export default function InboxPage() {
  const posts = useInboxStore((s) => s.posts);
  const total = useInboxStore((s) => s.total);
  const loading = useInboxStore((s) => s.loading);
  const stats = useInboxStore((s) => s.stats);
  const fetchInbox = useInboxStore((s) => s.fetchInbox);
  const fetchStats = useInboxStore((s) => s.fetchStats);
  const approvePost = useInboxStore((s) => s.approvePost);
  const rejectPost = useInboxStore((s) => s.rejectPost);
  const editPost = useInboxStore((s) => s.editPost);
  const bulkApprove = useInboxStore((s) => s.bulkApprove);
  const bulkReject = useInboxStore((s) => s.bulkReject);

  const [filter, setFilter] = useState("awaiting_approval");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingPost, setEditingPost] = useState<InboxPost | null>(null);
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null);
  const [refiningPostId, setRefiningPostId] = useState<string | null>(null);
  const [sendingEmailForPost, setSendingEmailForPost] = useState<InboxPost | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInbox({ status: filter });
    fetchStats();
  }, [fetchInbox, fetchStats, filter]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleApprove = async (id: string) => {
    await approvePost(id);
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleRejectConfirm = async (reason?: string) => {
    if (!rejectingPostId) return;
    await rejectPost(rejectingPostId, reason);
    setRejectingPostId(null);
    setSelected((prev) => { const n = new Set(prev); n.delete(rejectingPostId); return n; });
  };

  const handleRegenerate = async (id: string) => {
    await api.post(`/agents/content/regenerate/${id}`);
    fetchInbox({ status: filter });
  };

  const handleSendEmail = async (_postId: string, email: string) => {
    if (!sendingEmailForPost) return;
    await api.post(`/inbox/${sendingEmailForPost.id}/send-approval-email`, {
      recipientEmail: email,
    });
    setSendingEmailForPost(null);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const topic = prompt("What topic should we generate content about?");
      if (!topic) { setGenerating(false); return; }
      await api.post("/agents/content/generate", { topic, platforms: [] });
      fetchInbox({ status: "awaiting_approval" });
      setFilter("awaiting_approval");
      fetchStats();
    } finally { setGenerating(false); }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Inbox</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats && (
              <>
                {stats.awaiting} awaiting &middot; {stats.approvedToday} approved today &middot; {stats.rejectedToday} rejected today
              </>
            )}
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Sparkles className="size-4 mr-1.5" />}
          Generate Posts
        </Button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setSelected(new Set()); }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              filter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-ring"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <BulkActionBar
        selectedCount={selected.size}
        onApproveAll={() => bulkApprove([...selected])}
        onRejectAll={() => bulkReject([...selected])}
        onClear={() => setSelected(new Set())}
      />

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Loading inbox...</Card>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium">No posts here</p>
          <p className="text-xs text-muted-foreground mt-1">
            {filter === "awaiting_approval"
              ? "Generate new content or wait for agents to create posts."
              : "No posts match this filter."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <InboxCard
              key={post.id}
              post={post}
              selected={selected.has(post.id)}
              onSelect={toggleSelect}
              onApprove={handleApprove}
              onReject={(id) => setRejectingPostId(id)}
              onEdit={(p) => setEditingPost(p)}
              onRegenerate={handleRegenerate}
              onRefine={(id) => setRefiningPostId(id)}
              onSendEmail={(p) => setSendingEmailForPost(p)}
            />
          ))}
        </div>
      )}

      <EditModal
        post={editingPost}
        open={!!editingPost}
        onClose={() => setEditingPost(null)}
        onSave={editPost}
      />

      <RejectionReasonModal
        open={!!rejectingPostId}
        onClose={() => setRejectingPostId(null)}
        onConfirm={handleRejectConfirm}
      />

      <RefineFeedback
        postId={refiningPostId}
        open={!!refiningPostId}
        onClose={() => setRefiningPostId(null)}
        onRefineComplete={() => fetchInbox({ status: filter })}
      />

      <SendEmailModal
        postId={sendingEmailForPost?.id ?? ""}
        postTitle={sendingEmailForPost?.title ?? ""}
        open={!!sendingEmailForPost}
        onClose={() => setSendingEmailForPost(null)}
        onSend={handleSendEmail}
      />
    </div>
  );
}
