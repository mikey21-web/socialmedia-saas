'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { ChatWindow } from '@/components/agent-chat/chat-window';
import { AgentSelector } from '@/components/agent-chat/agent-selector';
import { ApprovalModal } from '@/components/agent-chat/approval-modal';

export default function ChatPage() {
  const { createSession, currentSessionId } = useChatStore();

  useEffect(() => {
    if (!currentSessionId) {
      createSession('New Chat', 'supervisor');
    }
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4 h-screen bg-gray-950">
      <div className="col-span-1 border-r border-gray-800 p-4 overflow-y-auto">
        <AgentSelector />
        <ApprovalModal />
      </div>
      <div className="col-span-3 p-4">
        <ChatWindow />
      </div>
    </div>
  );
}
