// Frontend API client for Agent Chat
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type AgentName = 'strategy' | 'content' | 'analytics' | 'engagement' | 'intelligence' | 'supervisor';

export interface PendingApproval {
  type: 'post_draft' | 'reply' | 'schedule';
  data: Record<string, unknown>;
  approvalId: string;
}

export interface ChatResponse {
  sessionId: string;
  reply: string;
  agentName: AgentName;
  pendingApprovals: PendingApproval[];
  toolCallsMade: number;
}

export interface AgentSession {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
  messages: Array<{ content: string; createdAt: string; role: string }>;
}

export interface AgentMessage {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  agentName?: AgentName;
  toolCalls?: unknown;
  createdAt: string;
}

export interface Goal {
  id: string;
  teamId: string;
  title: string;
  description: string;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  platform?: string;
  deadline: string;
  status: string;
  createdAt: string;
}

export async function sendAgentMessage(
  message: string,
  agent: AgentName,
  sessionId?: string,
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/agent-chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message, agent, sessionId }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json() as Promise<ChatResponse>;
}

export async function getAgentSessions(): Promise<AgentSession[]> {
  const res = await fetch(`${API_BASE}/agent-chat/sessions`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to get sessions');
  return res.json() as Promise<AgentSession[]>;
}

export async function getSessionMessages(
  sessionId: string,
): Promise<{ session: AgentSession; messages: AgentMessage[] } | null> {
  const res = await fetch(`${API_BASE}/agent-chat/sessions/${sessionId}`, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ session: AgentSession; messages: AgentMessage[] }>;
}

export async function getGoals(): Promise<Goal[]> {
  const res = await fetch(`${API_BASE}/agent-chat/goals`, {
    credentials: 'include',
  });
  if (!res.ok) return [];
  return res.json() as Promise<Goal[]>;
}

export async function approveAction(
  sessionId: string,
  approvalId: string,
  action: 'approve' | 'reject',
): Promise<{ success: boolean }> {
  const res = await fetch(
    `${API_BASE}/agent-chat/sessions/${sessionId}/approve/${approvalId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action }),
    },
  );
  if (!res.ok) throw new Error('Failed to process approval');
  return res.json() as Promise<{ success: boolean }>;
}

/** SSE streaming — returns an EventSource-like cleanup function */
export function streamAgentMessage(
  message: string,
  agent: AgentName,
  sessionId: string | undefined,
  onChunk: (chunk: string) => void,
  onApprovals: (approvals: PendingApproval[]) => void,
  onDone: (data: { sessionId: string; toolCallsMade: number }) => void,
  onError: (err: string) => void,
): () => void {
  const params = new URLSearchParams({
    message,
    agent,
    ...(sessionId ? { sessionId } : {}),
  });

  const eventSource = new EventSource(
    `${API_BASE}/agent-chat/stream?${params.toString()}`,
    { withCredentials: true },
  );

  eventSource.onmessage = (e: MessageEvent<string>) => {
    try {
      const data = JSON.parse(e.data) as {
        type: string;
        content?: string;
        data?: PendingApproval[];
        sessionId?: string;
        toolCallsMade?: number;
        pendingApprovals?: PendingApproval[];
        message?: string;
      };

      if (data.type === 'chunk' && data.content) {
        onChunk(data.content);
      } else if (data.type === 'approvals' && data.data) {
        onApprovals(data.data);
      } else if (data.type === 'done') {
        onDone({ sessionId: data.sessionId ?? '', toolCallsMade: data.toolCallsMade ?? 0 });
        if (data.pendingApprovals?.length) {
          onApprovals(data.pendingApprovals);
        }
        eventSource.close();
      } else if (data.type === 'error') {
        onError(data.message ?? 'Unknown error');
        eventSource.close();
      }
    } catch {
      // non-JSON frame
    }
  };

  eventSource.onerror = () => {
    onError('Connection lost');
    eventSource.close();
  };

  return () => eventSource.close();
}
