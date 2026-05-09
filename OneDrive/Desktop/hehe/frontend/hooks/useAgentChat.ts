import { useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { ChatMessage, ChatResponse, AgentName } from '@/types/agent';
import { v4 as uuid } from 'uuid';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export function useAgentChat() {
  const {
    currentSessionId,
    selectedAgent,
    addMessage,
    setIsLoading,
    setPendingApprovals,
  } = useChatStore();

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) return;

      setIsLoading(true);
      const userMsg: ChatMessage = {
        id: uuid(),
        role: 'user',
        content: userMessage,
        createdAt: new Date(),
      };
      addMessage(userMsg);

      try {
        const response = await fetch(`${API_URL}/agent-chat/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('jwt_token')}`,
          },
          body: JSON.stringify({
            message: userMessage,
            agent: selectedAgent,
            sessionId: currentSessionId,
          }),
        });

        if (!response.ok) throw new Error('Failed to send message');

        const data: ChatResponse = await response.json();

        const assistantMsg: ChatMessage = {
          id: uuid(),
          role: 'assistant',
          content: data.reply,
          agentName: data.agentName,
          createdAt: new Date(),
        };

        addMessage(assistantMsg);
        setPendingApprovals(data.pendingApprovals);
      } catch (error) {
        console.error('Chat error:', error);
        addMessage({
          id: uuid(),
          role: 'assistant',
          content: 'Error processing request. Please try again.',
          createdAt: new Date(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [currentSessionId, selectedAgent, addMessage, setIsLoading, setPendingApprovals],
  );

  const streamMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) return;

      setIsLoading(true);
      const userMsg: ChatMessage = {
        id: uuid(),
        role: 'user',
        content: userMessage,
        createdAt: new Date(),
      };
      addMessage(userMsg);

      const streamingMsgId = uuid();
      let streamingContent = '';

      try {
        const response = await fetch(
          `${API_URL}/agent-chat/stream?message=${encodeURIComponent(userMessage)}&agent=${selectedAgent}&sessionId=${currentSessionId || ''}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('jwt_token')}`,
            },
          },
        );

        if (!response.ok) throw new Error('Stream failed');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(6));

                if (eventData.type === 'chunk') {
                  streamingContent += eventData.content;
                  addMessage({
                    id: streamingMsgId,
                    role: 'assistant',
                    content: streamingContent,
                    isStreaming: true,
                    createdAt: new Date(),
                  });
                } else if (eventData.type === 'approvals') {
                  setPendingApprovals(eventData.data);
                } else if (eventData.type === 'done') {
                  addMessage({
                    id: streamingMsgId,
                    role: 'assistant',
                    content: streamingContent,
                    agentName: eventData.agentName,
                    isStreaming: false,
                    createdAt: new Date(),
                  });
                  setPendingApprovals(eventData.pendingApprovals);
                }
              } catch (e) {
                // skip parse errors
              }
            }
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentSessionId, selectedAgent, addMessage, setIsLoading, setPendingApprovals],
  );

  return { sendMessage, streamMessage };
}
