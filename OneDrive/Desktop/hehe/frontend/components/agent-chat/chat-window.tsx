'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAgentChat } from '@/hooks/useAgentChat';
import { ChatMessage as ChatMessageType } from '@/types/agent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';

export function ChatWindow() {
  const { currentMessages, isLoading } = useChatStore();
  const { streamMessage } = useAgentChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    await streamMessage(msg);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-800">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {currentMessages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p>Start a conversation with the agent</p>
            </div>
          )}
          {currentMessages.map((msg) => (
            <ChatMessageComponent key={msg.id} message={msg} />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-gray-800 p-4 space-y-2">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            disabled={isLoading}
            className="bg-gray-800 border-gray-700"
          />
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? '...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChatMessageComponent({ message }: { message: ChatMessageType }) {
  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-xs px-4 py-2 rounded-lg ${
          message.role === 'user'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-100'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        {message.agentName && (
          <p className="text-xs text-gray-400 mt-1">Agent: {message.agentName}</p>
        )}
      </div>
    </div>
  );
}
