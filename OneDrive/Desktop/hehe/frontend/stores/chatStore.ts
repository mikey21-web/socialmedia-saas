import { create } from 'zustand';
import { ChatMessage, ChatSession, AgentName, PendingApproval } from '@/types/agent';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentMessages: ChatMessage[];
  selectedAgent: AgentName;
  isLoading: boolean;
  pendingApprovals: PendingApproval[];

  setCurrentSession: (sessionId: string) => void;
  createSession: (title: string, agent: AgentName) => void;
  addMessage: (message: ChatMessage) => void;
  setIsLoading: (loading: boolean) => void;
  setSelectedAgent: (agent: AgentName) => void;
  setPendingApprovals: (approvals: PendingApproval[]) => void;
  clearSession: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  currentSessionId: null,
  currentMessages: [],
  selectedAgent: 'supervisor',
  isLoading: false,
  pendingApprovals: [],

  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
  createSession: (title, agent) =>
    set((state) => ({
      sessions: [
        ...state.sessions,
        {
          id: `session_${Date.now()}`,
          title,
          agentName: agent,
          createdAt: new Date(),
          updatedAt: new Date(),
          messageCount: 0,
        },
      ],
    })),
  addMessage: (message) =>
    set((state) => ({
      currentMessages: [...state.currentMessages, message],
    })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  setPendingApprovals: (approvals) => set({ pendingApprovals: approvals }),
  clearSession: () =>
    set({ currentSessionId: null, currentMessages: [], pendingApprovals: [] }),
}));
