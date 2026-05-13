'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bot,
  Send,
  Loader2,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Zap,
  BarChart2,
  MessageSquare,
  Globe,
  Target,
} from 'lucide-react';
import {
  AgentName,
  PendingApproval,
  sendAgentMessage,
  streamAgentMessage,
  approveAction,
  getAgentSessions,
  AgentSession,
} from '@/lib/agent-chat';

interface AgentSidebarProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentName?: AgentName;
  pendingApprovals?: PendingApproval[];
  streaming?: boolean;
}

const AGENT_CONFIG: Record<
  AgentName,
  { label: string; icon: React.ElementType; color: string; description: string }
> = {
  strategy: {
    label: 'Strategy',
    icon: Target,
    color: 'from-violet-500 to-purple-600',
    description: 'Goals, campaigns & growth plans',
  },
  content: {
    label: 'Content',
    icon: Zap,
    color: 'from-amber-500 to-orange-600',
    description: 'Draft, schedule & repurpose posts',
  },
  analytics: {
    label: 'Analytics',
    icon: BarChart2,
    color: 'from-blue-500 to-cyan-600',
    description: 'Performance insights & reports',
  },
  engagement: {
    label: 'Engagement',
    icon: MessageSquare,
    color: 'from-rose-500 to-pink-600',
    description: 'Replies, comments & community',
  },
  intelligence: {
    label: 'Intelligence',
    icon: Globe,
    color: 'from-emerald-500 to-teal-600',
    description: 'Trends & competitor analysis',
  },
  supervisor: {
    label: 'Supervisor',
    icon: Bot,
    color: 'from-indigo-500 to-blue-600',
    description: 'Auto-routes to the best agent',
  },
};

export function AgentSidebar({ open, onClose }: AgentSidebarProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentName>('supervisor');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [streamMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cleanupStreamRef = useRef<(() => void) | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const data = await getAgentSessions();
      setSessions(data);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (open) {
      getAgentSessions().then(setSessions).catch(() => {});
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput('');
    setLoading(true);

    const userMsgId = crypto.randomUUID();
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: msg },
    ]);

    if (streamMode) {
      const streamingMsgId = crypto.randomUUID();
      setMessages(prev => [
        ...prev,
        { id: streamingMsgId, role: 'assistant', content: '', agentName: selectedAgent, streaming: true },
      ]);

      let finalSessionId = sessionId;
      let accumulated = '';

      const cleanup = streamAgentMessage(
        msg,
        selectedAgent,
        sessionId,
        (chunk) => {
          accumulated += chunk;
          setMessages(prev =>
            prev.map(m =>
              m.id === streamingMsgId
                ? { ...m, content: accumulated, streaming: true }
                : m,
            ),
          );
        },
        (approvals) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === streamingMsgId
                ? { ...m, pendingApprovals: [...(m.pendingApprovals ?? []), ...approvals] }
                : m,
            ),
          );
        },
        ({ sessionId: sid }) => {
          finalSessionId = sid;
          setSessionId(sid);
          setMessages(prev =>
            prev.map(m =>
              m.id === streamingMsgId ? { ...m, streaming: false } : m,
            ),
          );
          setLoading(false);
          void finalSessionId;
          loadSessions();
        },
        (errMsg) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === streamingMsgId
                ? { ...m, content: `Error: ${errMsg}`, streaming: false }
                : m,
            ),
          );
          setLoading(false);
        },
      );

      cleanupStreamRef.current = cleanup;
    } else {
      try {
        const response = await sendAgentMessage(msg, selectedAgent, sessionId);
        setSessionId(response.sessionId);
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.reply,
            agentName: selectedAgent,
            pendingApprovals: response.pendingApprovals,
          },
        ]);
        loadSessions();
      } catch {
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Something went wrong. Please try again.',
            agentName: selectedAgent,
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
  }, [input, loading, selectedAgent, sessionId, streamMode, loadSessions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleApproval = async (
    approval: PendingApproval,
    msgId: string,
    action: 'approve' | 'reject',
  ) => {
    if (!sessionId) return;
    try {
      await approveAction(sessionId, approval.approvalId, action);
      // Remove the approval from the message
      setMessages(prev =>
        prev.map(m =>
          m.id === msgId
            ? {
                ...m,
                pendingApprovals: m.pendingApprovals?.filter(
                  a => a.approvalId !== approval.approvalId,
                ),
              }
            : m,
        ),
      );
    } catch {
      // silently fail
    }
  };

  const startNewSession = () => {
    cleanupStreamRef.current?.();
    setMessages([]);
    setSessionId(undefined);
    setShowSessions(false);
    inputRef.current?.focus();
  };

  const loadSession = (session: AgentSession) => {
    setSessionId(session.id);
    setShowSessions(false);
    // Optionally load messages from session here
  };

  const agentConfig = AGENT_CONFIG[selectedAgent];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-background border-l border-border flex flex-col z-50 shadow-2xl"
          >
            {/* Header */}
            <div className={`bg-linear-to-r ${agentConfig.color} p-4 flex items-center justify-between shrink-0`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <agentConfig.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">
                    {agentConfig.label} Agent
                  </div>
                  <div className="text-white/70 text-xs">{agentConfig.description}</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Agent Selector */}
            <div className="flex gap-1.5 p-3 border-b border-border overflow-x-auto shrink-0 bg-muted/30">
              {(Object.entries(AGENT_CONFIG) as [AgentName, typeof agentConfig][]).map(
                ([name, cfg]) => (
                  <button
                    key={name}
                    onClick={() => setSelectedAgent(name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedAgent === name
                        ? `bg-linear-to-r ${cfg.color} text-white shadow-sm`
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <cfg.icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </button>
                ),
              )}
            </div>

            {/* Session Controls */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
              <button
                onClick={() => setShowSessions(v => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bot className="w-3.5 h-3.5" />
                {sessionId ? `Session #${sessionId.slice(-6)}` : 'New conversation'}
                <ChevronDown className={`w-3 h-3 transition-transform ${showSessions ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={startNewSession}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
              >
                + New chat
              </button>
            </div>

            {/* Sessions dropdown */}
            <AnimatePresence>
              {showSessions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-border shrink-0"
                >
                  <div className="max-h-48 overflow-y-auto">
                    {sessions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No previous sessions
                      </p>
                    ) : (
                      sessions.map(s => (
                        <button
                          key={s.id}
                          onClick={() => loadSession(s)}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                        >
                          <p className="text-xs font-medium truncate">{s.title ?? 'Untitled'}</p>
                          <p className="text-xs text-muted-foreground">
                            {s._count.messages} messages ·{' '}
                            {new Date(s.updatedAt).toLocaleDateString()}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
                  <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${agentConfig.color} flex items-center justify-center shadow-lg`}>
                    <agentConfig.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {agentConfig.label} Agent
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-[280px]">
                      {agentConfig.description}. Ask me anything to get started.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-[300px]">
                    {getStarterPrompts(selectedAgent).map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => {
                          setInput(prompt);
                          inputRef.current?.focus();
                        }}
                        className="text-xs text-left px-3 py-2 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className={`w-7 h-7 rounded-lg bg-linear-to-br ${agentConfig.color} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}
                    >
                      {msg.content || (msg.streaming && <StreamingIndicator />)}
                      {msg.streaming && msg.content && (
                        <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse rounded-sm" />
                      )}
                    </div>

                    {/* Pending Approvals */}
                    {msg.pendingApprovals && msg.pendingApprovals.length > 0 && (
                      <div className="space-y-2 w-full">
                        <p className="text-xs text-muted-foreground font-medium">
                          Pending approvals:
                        </p>
                        {msg.pendingApprovals.map(approval => (
                          <ApprovalCard
                            key={approval.approvalId}
                            approval={approval}
                            onApprove={() => void handleApproval(approval, msg.id, 'approve')}
                            onReject={() => void handleApproval(approval, msg.id, 'reject')}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && !messages.some(m => m.streaming) && (
                <div className="flex gap-3 justify-start">
                  <div className={`w-7 h-7 rounded-lg bg-linear-to-br ${agentConfig.color} flex items-center justify-center`}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                    <StreamingIndicator />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border shrink-0 bg-background">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask ${agentConfig.label} agent…`}
                  rows={1}
                  disabled={loading}
                  className="flex-1 resize-none rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all min-h-[40px] max-h-[120px] disabled:opacity-50"
                  style={{ height: 'auto' }}
                  onInput={e => {
                    const t = e.target as HTMLTextAreaElement;
                    t.style.height = 'auto';
                    t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
                  }}
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={loading || !input.trim()}
                  className={`w-10 h-10 rounded-xl bg-linear-to-br ${agentConfig.color} flex items-center justify-center shrink-0 shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StreamingIndicator() {
  return (
    <div className="flex gap-1 items-center h-4">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

function ApprovalCard({
  approval,
  onApprove,
  onReject,
}: {
  approval: PendingApproval;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [decided, setDecided] = useState<'approved' | 'rejected' | null>(null);

  const handleApprove = () => {
    setDecided('approved');
    onApprove();
  };

  const handleReject = () => {
    setDecided('rejected');
    onReject();
  };

  const preview =
    approval.type === 'post_draft'
      ? `Post draft for ${String((approval.data.platforms as string[] | undefined)?.[0] ?? approval.data.platform ?? 'platform')}`
      : approval.type === 'reply'
        ? `Reply: "${String((approval.data.suggestedReply as string | undefined)?.slice(0, 60) ?? '')}…"`
        : 'Scheduled action';

  if (decided) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${decided === 'approved' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
        {decided === 'approved' ? (
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <XCircle className="w-3.5 h-3.5 shrink-0" />
        )}
        {decided === 'approved' ? 'Approved' : 'Rejected'}
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl p-3 bg-card space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {approval.type.replace('_', ' ')}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{preview}</p>
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approve
        </button>
        <button
          onClick={handleReject}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-medium transition-colors"
        >
          <XCircle className="w-3.5 h-3.5" />
          Reject
        </button>
      </div>
    </div>
  );
}

function getStarterPrompts(agent: AgentName): string[] {
  const prompts: Record<AgentName, string[]> = {
    supervisor: [
      'Help me grow my social media presence',
      'What should I focus on this week?',
      'Create a content plan for this month',
    ],
    strategy: [
      'Create a goal to reach 5,000 Instagram followers in 90 days',
      'Build a launch campaign for next month',
      'Check progress on my current goals',
    ],
    content: [
      'Draft 3 posts about our latest product update',
      'Repurpose our blog post for Twitter and LinkedIn',
      'Schedule my draft posts for next week',
    ],
    analytics: [
      'Diagnose my performance over the last 30 days',
      'What are my best performing posts?',
      'Generate an executive report for this month',
    ],
    engagement: [
      'Show me unanswered comments',
      'Draft replies for recent comments',
      'What is my current engagement rate?',
    ],
    intelligence: [
      'What trends should I be posting about?',
      'What are my competitors doing this week?',
      'Suggest ways to respond to competitor viral content',
    ],
  };
  return prompts[agent];
}
