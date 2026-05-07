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
import { Textarea } from "@/components/ui/textarea";

interface RejectionReasonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

export function RejectionReasonModal({ open, onClose, onConfirm }: RejectionReasonModalProps) {
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Optionally provide a reason (feeds into agent learning).</p>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. too promotional, off-brand tone..." rows={3} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onConfirm(reason || undefined); setReason(""); }}>
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
