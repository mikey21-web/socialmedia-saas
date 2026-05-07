"use client";

import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SendEmailModalProps {
  postId: string;
  postTitle: string;
  open: boolean;
  onClose: () => void;
  onSend: (postId: string, email: string) => Promise<void>;
}

export function SendEmailModal({ postId, postTitle, open, onClose, onSend }: SendEmailModalProps) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email.trim()) {
      setError("Email address is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await onSend(postId, email);
      setEmail("");
      onClose();
    } catch {
      setError("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Approval Email</DialogTitle>
          <DialogDescription>
            Send an email with an approval link for <strong>"{postTitle}"</strong>.
            The recipient will be able to approve or reject the post via email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="approval-email">
            Recipient Email
          </label>
          <Input
            id="approval-email"
            type="email"
            placeholder="reviewer@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sending}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Mail className="size-3.5 mr-1.5" />}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
