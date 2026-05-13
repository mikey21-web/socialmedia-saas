export type AgentName = 'strategy' | 'content' | 'analytics' | 'engagement' | 'intelligence' | 'supervisor';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentName?: AgentName;
  createdAt: Date;
  isStreaming?: boolean;
}

export interface PendingApproval {
  approvalId: string;
  type: 'post_draft' | 'reply' | 'goal' | 'campaign' | 'report';
  title: string;
  description: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  agentName: AgentName;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface ChatResponse {
  sessionId: string;
  reply: string;
  agentName: AgentName;
  pendingApprovals: PendingApproval[];
  toolCallsMade: number;
}
