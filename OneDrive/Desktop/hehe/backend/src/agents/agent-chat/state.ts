import { BaseMessage } from '@langchain/core/messages';

export interface PendingApproval {
  approvalId: string;
  type: 'post_draft' | 'reply' | 'goal' | 'campaign' | 'report' | 'schedule';
  title?: string;
  description?: string;
  data: Record<string, unknown>;
  createdAt?: string;
}

export function generateApprovalId(): string {
  return `approval_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface AgentGraphState {
  messages: BaseMessage[];
  teamId: string;
  sessionId: string;
  pendingApprovals: PendingApproval[];
  nextAgent: string | null;
  iterations: number;
}

export const defaultState = (teamId: string, sessionId: string): AgentGraphState => ({
  messages: [],
  teamId,
  sessionId,
  pendingApprovals: [],
  nextAgent: null,
  iterations: 0,
});
