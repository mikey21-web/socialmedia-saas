"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface RefineFeedbackProps {
  postId: string | null;
  open: boolean;
  onClose: () => void;
  onRefineComplete: () => void;
}

export function RefineFeedback({ postId, open, onClose, onRefineComplete }: RefineFeedbackProps) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!postId || !feedback.trim()) return;
    setLoading(true);
    try {
      await api.post(`/agents/content/refine/${postId}`, { feedback });
      setFeedback("");
      onRefineComplete();
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refine with Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Tell the AI what to change.</p>
          <Input
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder='e.g. "make it shorter", "more casual", "add a data point"'
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !feedback.trim()}>
            {loading ? "Refining..." : "Refine"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
