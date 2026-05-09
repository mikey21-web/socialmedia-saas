'use client';

import { useChatStore } from '@/stores/chatStore';
import { PendingApproval } from '@/types/agent';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export function ApprovalModal() {
  const { pendingApprovals, currentSessionId } = useChatStore();
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);

  if (pendingApprovals.length === 0) return null;

  const handleApprove = async (approval: PendingApproval) => {
    if (!currentSessionId) return;

    try {
      const response = await fetch(
        `${API_URL}/agent-chat/sessions/${currentSessionId}/approve/${approval.approvalId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('jwt_token')}`,
          },
          body: JSON.stringify({ action: 'approve' }),
        },
      );

      if (response.ok) {
        setSelectedApproval(null);
        // Refresh approvals list
      }
    } catch (error) {
      console.error('Approval error:', error);
    }
  };

  return (
    <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
      <div className="space-y-2">
        <p className="text-sm font-semibold">Pending Approvals ({pendingApprovals.length})</p>
        {pendingApprovals.map((approval) => (
          <Button
            key={approval.approvalId}
            variant="outline"
            className="w-full justify-start"
            onClick={() => setSelectedApproval(approval)}
          >
            <span>{approval.title}</span>
          </Button>
        ))}
      </div>

      {selectedApproval && (
        <DialogContent>
          <DialogTitle>{selectedApproval.title}</DialogTitle>
          <p className="text-sm text-gray-500">{selectedApproval.description}</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setSelectedApproval(null)}>
              Reject
            </Button>
            <Button onClick={() => handleApprove(selectedApproval)}>Approve</Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
