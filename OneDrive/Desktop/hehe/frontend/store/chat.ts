import { create } from 'zustand';
import type { AgentName, ChatMessage, ChatSession, PendingApproval } from '@/types/agent';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentMessages: ChatMessage[];
  selectedAgent: AgentName;
  isLoading: boolean;
  pendingApprovals: PendingApproval[];

  setCurrentSession: (sessionId: string | null) => void;
  createSession: (title: string, agent: AgentName) => string;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  setIsLoading: (loading: boolean) => void;
  setSelectedAgent: (agent: AgentName) => void;
  setPendingApprovals: (approvals: PendingApproval[]) => void;
  clearSession: () => void;
  loadSessions: (sessions: ChatSession[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  currentSessionId: null,
  currentMessages: [],
  selectedAgent: 'supervisor',
  isLoading: false,
  pendingApprovals: [],

  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),

  createSession: (title, agent) => {
    const id = `session_${Date.now()}`;
    set((state) => ({
      sessions: [
        {
          id,
          title,
          agentName: agent,
          createdAt: new Date(),
          updatedAt: new Date(),
          messageCount: 0,
        },
        ...state.sessions,
      ],
      currentSessionId: id,
      currentMessages: [],
      pendingApprovals: [],
    }));
    return id;
  },

  addMessage: (message) =>
    set((state) => {
      // Deduplicate by id — replace if streaming update
      const exists = state.currentMessages.some((m) => m.id === message.id);
      if (exists) {
        return {
          currentMessages: state.currentMessages.map((m) =>
            m.id === message.id ? message : m,
          ),
        };
      }
      return { currentMessages: [...state.currentMessages, message] };
    }),

  updateMessage: (id, patch) =>
    set((state) => ({
      currentMessages: state.currentMessages.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    })),

  setIsLoading: (loading) => set({ isLoading: loading }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  setPendingApprovals: (approvals) => set({ pendingApprovals: approvals }),

  clearSession: () =>
    set({ currentSessionId: null, currentMessages: [], pendingApprovals: [] }),

  loadSessions: (sessions) => set({ sessions }),
}));
