"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Brain,
  BarChart2,
  ImageIcon,
  MessageSquare,
  Pen,
  Zap,
  Loader2,
  Play,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Eye,
  Video,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PixelOffice } from "@/components/pixel-office/pixel-office";

/* ─── Agent definitions ──────────────────────────────────── */

interface AgentDef {
  id: string;
  name: string;
  role: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  avatar: string;
  responsibilities: string[];
}

const AGENTS: AgentDef[] = [
  {
    id: "strategist",
    name: "Maya",
    role: "Strategist",
    icon: Brain,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    glowColor: "shadow-blue-500/20",
    avatar: "🧠",
    responsibilities: ["Content strategy", "Campaign planning", "Brief generation"],
  },
  {
    id: "copywriter",
    name: "Alex",
    role: "Copywriter",
    icon: Pen,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    glowColor: "shadow-emerald-500/20",
    avatar: "✍️",
    responsibilities: ["Post creation", "Brand voice matching", "Humanization"],
  },
  {
    id: "designer",
    name: "Pixel",
    role: "Designer",
    icon: ImageIcon,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    glowColor: "shadow-purple-500/20",
    avatar: "🎨",
    responsibilities: ["Image generation", "Platform adapting", "Carousel covers"],
  },
  {
    id: "analyst",
    name: "Nova",
    role: "Analyst",
    icon: BarChart2,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    glowColor: "shadow-amber-500/20",
    avatar: "📊",
    responsibilities: ["Performance reviews", "Winning patterns", "Competitor intel"],
  },
  {
    id: "engagement_manager",
    name: "Echo",
    role: "Engagement Mgr",
    icon: MessageSquare,
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    glowColor: "shadow-rose-500/20",
    avatar: "💬",
    responsibilities: ["Reply drafting", "Intent classification", "Community mgmt"],
  },
  {
    id: "ugc_video",
    name: "Reel",
    role: "UGC Video",
    icon: Video,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    glowColor: "shadow-pink-500/20",
    avatar: "🎬",
    responsibilities: ["Script writing", "Avatar videos", "B-roll generation", "Thumbnails"],
  },
];

const AGENT_MAP = Object.fromEntries(AGENTS.map((a) => [a.id, a]));

/* ─── Conversation mapping ───────────────────────────────── */

const WORKFLOW_CONVERSATIONS: Record<string, { from: string; to: string; message: string }[]> = {
  strategist: [
    { from: "strategist", to: "analyst", message: "Nova, pull yesterday's performance. Do we need to adjust strategy?" },
    { from: "analyst", to: "strategist", message: "Avg impressions down 15%. Carousel posts outperform singles by 3x. Recommending pivot." },
    { from: "strategist", to: "copywriter", message: "Alex, here's today's brief. Focus on carousel-style educational content." },
  ],
  copywriter: [
    { from: "copywriter", to: "strategist", message: "Maya, the brief says 'summer trends' — which pillar should I map this to?" },
    { from: "strategist", to: "copywriter", message: "Map to 'Seasonal Looks'. Use the contrarian hook format — it tested best last week." },
    { from: "copywriter", to: "designer", message: "Pixel, here's the image prompt: 'Summer hair transformation, before/after, bright salon lighting'" },
  ],
  designer: [
    { from: "designer", to: "copywriter", message: "Alex, generated 3 image variants. Which one matches the post vibe?" },
    { from: "copywriter", to: "designer", message: "Variant 2 is perfect. Can you adapt it for Instagram (4:5) and X (16:9)?" },
    { from: "designer", to: "copywriter", message: "Done. Uploaded platform-adapted versions. Post is ready for scheduling." },
  ],
  analyst: [
    { from: "analyst", to: "strategist", message: "Maya, weekly report ready. Top 3 posts all used POV hooks. Engagement up 22%." },
    { from: "strategist", to: "analyst", message: "Great. What are competitors doing differently this week?" },
    { from: "analyst", to: "engagement_manager", message: "Echo, 12 new comments need replies. 3 are buyer inquiries — prioritize those." },
  ],
  engagement_manager: [
    { from: "engagement_manager", to: "copywriter", message: "Alex, I need a reply in our brand voice for this complaint about wait times." },
    { from: "copywriter", to: "engagement_manager", message: "Here's a draft: 'We hear you. Wait times have been longer than usual...' — humanized and on-brand." },
    { from: "engagement_manager", to: "analyst", message: "Nova, this week's sentiment: 82% positive, 12% neutral, 6% negative. Flagging the negative trend." },
  ],
  ugc_video: [
    { from: "ugc_video", to: "strategist", message: "Maya, give me today's UGC brief. What topics should I script for Reels?" },
    { from: "strategist", to: "ugc_video", message: "Focus on 'summer hair transformations'. Use the POV hook style — it crushed it last week." },
    { from: "ugc_video", to: "designer", message: "Pixel, I need a thumbnail for this Reel — 'Before/after summer glow-up, bright salon vibe'." },
    { from: "ugc_video", to: "copywriter", message: "Alex, here's the script for review — 22 seconds, mixed talking-head + b-roll. Does the hook land?" },
    { from: "copywriter", to: "ugc_video", message: "Hook is fire 🔥 — swap 'Check this out' with 'POV: your stylist just changed your life'. More scroll-stopping." },
  ],
};

/* ─── Types ──────────────────────────────────────────────── */

interface BossThought {
  id: string;
  timestamp: string;
  type: "assessment" | "decision" | "delegation" | "review" | "correction" | "complete";
  agent?: string;
  message: string;
  reasoning?: string;
  data?: Record<string, unknown>;
}

interface BossCycleResult {
  thoughts: BossThought[];
  postsGenerated: number;
  engagementProcessed: number;
  decisionsOverridden: number;
  durationMs: number;
}

interface ActivityItem {
  id: string;
  agent: string;
  action: string;
  status: string;
  durationMs: number;
  tokensUsed: number;
  costInr: number;
  timestamp: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: string;
}

interface AgencyStatus {
  hasActiveStrategy: boolean;
  strategyName?: string;
  strategyDaysRemaining: number;
  hasBrandVoice: boolean;
  brandVoiceName?: string;
  recentAgentRuns: number;
  pendingEngagementActions: number;
}

/* ─── Helper: format relative time ───────────────────────── */

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function describeAction(item: ActivityItem): string {
  const role = item.agent;
  const input = item.input ?? {};
  const output = item.output ?? {};
  switch (role) {
    case "strategist":
      if (input.type === "refine") return "Refining content strategy based on performance data";
      return "Generated content briefs for the team";
    case "copywriter": {
      const topic = (input as { pillarTopic?: string }).pillarTopic;
      return topic ? `Wrote post about "${topic}"` : "Created brand-voice matched content";
    }
    case "designer":
      return "Generated AI images and adapted for platforms";
    case "analyst":
      if ((input as { type?: string }).type === "weekly_report") return "Compiled weekly performance report";
      return "Analyzed yesterday's performance metrics";
    case "engagement_manager":
      return "Processed incoming messages and drafted replies";
    case "ugc_video":
      return "Generated UGC video script, avatar clip, and b-roll";
    default:
      return `Completed ${item.action} task`;
  }
}

/* ─── Components ─────────────────────────────────────────── */

function AgentDesk({ agent, isActive, onClick }: { agent: AgentDef; isActive: boolean; onClick: () => void }) {
  const Icon = agent.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group min-w-[140px]",
        agent.bgColor,
        agent.borderColor,
        isActive && `shadow-lg ${agent.glowColor} ring-2 ring-offset-2 ring-offset-background`,
        isActive ? "scale-105" : "hover:scale-102",
      )}
    >
      {isActive && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
      )}
      <span className="text-3xl mb-2">{agent.avatar}</span>
      <Icon className={cn("size-5 mb-1", agent.color)} />
      <span className="text-xs font-bold">{agent.name}</span>
      <span className={cn("text-[10px]", agent.color)}>{agent.role}</span>
    </button>
  );
}

function ChatBubble({
  fromAgent,
  toAgent,
  message,
  delay,
}: {
  fromAgent: AgentDef;
  toAgent: AgentDef;
  message: string;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!visible) {
    return (
      <div className="flex items-start gap-3 py-2 opacity-0 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-muted" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0", fromAgent.bgColor, "border", fromAgent.borderColor)}>
        {fromAgent.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("text-xs font-bold", fromAgent.color)}>{fromAgent.name}</span>
          <ArrowRight className="size-3 text-muted-foreground" />
          <span className={cn("text-xs font-medium", toAgent.color)}>{toAgent.name}</span>
        </div>
        <div className="text-sm text-foreground/90 bg-muted/50 rounded-lg rounded-tl-none px-3 py-2 border border-border/50">
          {message}
        </div>
      </div>
    </div>
  );
}

function ActivityFeedItem({ item }: { item: ActivityItem }) {
  const agent = AGENT_MAP[item.agent];
  if (!agent) return null;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0", agent.bgColor, "border", agent.borderColor)}>
        {agent.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-xs font-bold", agent.color)}>{agent.name} <span className="text-muted-foreground font-normal">({agent.role})</span></span>
          <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(item.timestamp)}</span>
        </div>
        <p className="text-sm text-foreground/80 mt-0.5">{describeAction(item)}</p>
        <div className="flex items-center gap-3 mt-1.5">
          {item.status === "success" ? (
            <Badge variant="secondary" className="text-[10px] gap-1"><CheckCircle2 className="size-3 text-green-500" /> Success</Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px] gap-1"><XCircle className="size-3" /> Failed</Badge>
          )}
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="size-3" />{(item.durationMs / 1000).toFixed(1)}s</span>
          {item.tokensUsed > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Sparkles className="size-3" />{item.tokensUsed} tokens</span>}
        </div>
      </div>
    </div>
  );
}

const BOSS_AGENT: AgentDef = {
  id: "boss",
  name: "Diyaa",
  role: "CEO",
  icon: Zap,
  color: "text-yellow-400",
  bgColor: "bg-yellow-500/10",
  borderColor: "border-yellow-500/30",
  glowColor: "shadow-yellow-500/20",
  avatar: "🤵",
  responsibilities: ["Decision making", "Task delegation", "Quality review", "Course correction"],
};

const THOUGHT_STYLES: Record<string, { icon: string; label: string; borderClass: string }> = {
  assessment: { icon: "🔍", label: "Assessing", borderClass: "border-l-blue-500" },
  decision: { icon: "⚡", label: "Deciding", borderClass: "border-l-yellow-500" },
  delegation: { icon: "📋", label: "Delegating", borderClass: "border-l-emerald-500" },
  review: { icon: "👀", label: "Reviewing", borderClass: "border-l-purple-500" },
  correction: { icon: "🔄", label: "Correcting", borderClass: "border-l-orange-500" },
  complete: { icon: "✅", label: "Complete", borderClass: "border-l-green-500" },
};

function BossThoughtBubble({ thought, index }: { thought: BossThought; index: number }) {
  const [visible, setVisible] = useState(false);
  const style = THOUGHT_STYLES[thought.type] ?? THOUGHT_STYLES.assessment;
  const targetAgent = thought.agent ? AGENT_MAP[thought.agent] : null;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 600);
    return () => clearTimeout(t);
  }, [index]);

  if (!visible) {
    return (
      <div className="flex items-start gap-3 py-2 opacity-0">
        <div className="w-8 h-8 rounded-full bg-muted" />
        <div className="h-4 w-64 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-start gap-3 py-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300",
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0",
        thought.type === "delegation" && targetAgent ? targetAgent.bgColor : "bg-yellow-500/10",
        "border",
        thought.type === "delegation" && targetAgent ? targetAgent.borderColor : "border-yellow-500/30",
      )}>
        {thought.type === "delegation" && targetAgent ? targetAgent.avatar : BOSS_AGENT.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-medium text-yellow-400">{BOSS_AGENT.name} (CEO)</span>
          {targetAgent && (
            <>
              <ArrowRight className="size-3 text-muted-foreground" />
              <span className={cn("text-[10px] font-medium", targetAgent.color)}>
                {targetAgent.name} ({targetAgent.role})
              </span>
            </>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {style.icon} {style.label}
          </span>
        </div>
        <div className={cn(
          "text-sm text-foreground/90 bg-muted/30 rounded-lg rounded-tl-none px-3 py-2 border-l-2 border border-border/50",
          style.borderClass,
        )}>
          <p className="whitespace-pre-line">{thought.message}</p>
          {thought.reasoning && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">{thought.reasoning}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */

export default function AgencyOfficePage() {
  const [status, setStatus] = useState<AgencyStatus | null>(null);
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bossRunning, setBossRunning] = useState(false);
  const [bossThoughts, setBossThoughts] = useState<BossThought[]>([]);
  const [bossResult, setBossResult] = useState<BossCycleResult | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [conversations, setConversations] = useState<{ from: string; to: string; message: string }[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const bossRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, feedRes] = await Promise.all([
        api.get("/api/agency/orchestrator/status"),
        api.get("/api/agency/orchestrator/activity-feed?limit=30"),
      ]);
      setStatus(statusRes.data);
      setFeed(feedRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 10s
  useEffect(() => {
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Poll boss thoughts while running
  useEffect(() => {
    if (!bossRunning) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get("/api/agency/boss/thoughts");
        if (res.data?.length > bossThoughts.length) {
          setBossThoughts(res.data);
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [bossRunning, bossThoughts.length]);

  // Auto-scroll boss thoughts
  useEffect(() => {
    if (bossRef.current) {
      bossRef.current.scrollTop = bossRef.current.scrollHeight;
    }
  }, [bossThoughts.length]);

  function handleAgentClick(agentId: string) {
    if (selectedAgent === agentId) {
      setSelectedAgent(null);
      setConversations([]);
    } else {
      setSelectedAgent(agentId);
      setConversations(WORKFLOW_CONVERSATIONS[agentId] ?? []);
    }
  }

  async function runBossCycle() {
    setBossRunning(true);
    setBossThoughts([]);
    setBossResult(null);
    try {
      const res = await api.post("/api/agency/boss/run");
      const result: BossCycleResult = res.data;
      setBossThoughts(result.thoughts);
      setBossResult(result);
      await fetchData();
    } catch { /* ignore */ }
    setBossRunning(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your AI office...</p>
        </div>
      </div>
    );
  }

  const activeAgents = new Set(feed.slice(0, 10).map((f) => f.agent));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="size-6 text-yellow-500" />
            The Office
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Watch your AI agents collaborate in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
          <Button onClick={runBossCycle} disabled={bossRunning} size="sm" className="gap-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white border-0">
            {bossRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            {bossRunning ? "Boss is thinking..." : "Run Boss Cycle"}
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border/50 px-4 py-3">
          <Brain className="size-4 text-blue-400" />
          <div>
            <p className="text-xs text-muted-foreground">Strategy</p>
            <p className="text-sm font-medium">{status?.hasActiveStrategy ? status.strategyName : "None"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border/50 px-4 py-3">
          <Sparkles className="size-4 text-emerald-400" />
          <div>
            <p className="text-xs text-muted-foreground">Brand Voice</p>
            <p className="text-sm font-medium">{status?.hasBrandVoice ? status.brandVoiceName : "Not set"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border/50 px-4 py-3">
          <TrendingUp className="size-4 text-amber-400" />
          <div>
            <p className="text-xs text-muted-foreground">Agent Runs (24h)</p>
            <p className="text-sm font-medium">{status?.recentAgentRuns ?? 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border/50 px-4 py-3">
          <MessageSquare className="size-4 text-rose-400" />
          <div>
            <p className="text-xs text-muted-foreground">Pending Replies</p>
            <p className="text-sm font-medium">{status?.pendingEngagementActions ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Boss Agent Panel */}
      {(bossThoughts.length > 0 || bossRunning) && (
        <Card className="ring-1 ring-yellow-500/30 overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-yellow-500/5 to-amber-500/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="text-lg">{BOSS_AGENT.avatar}</span>
              <span className="text-yellow-400 font-bold">{BOSS_AGENT.name}</span>
              <span className="text-muted-foreground font-normal">— CEO is {bossRunning ? "running the office..." : "done"}</span>
              {bossResult && (
                <div className="ml-auto flex items-center gap-3 text-[10px]">
                  <span className="text-emerald-400">{bossResult.postsGenerated} posts</span>
                  <span className="text-rose-400">{bossResult.engagementProcessed} replies</span>
                  {bossResult.decisionsOverridden > 0 && (
                    <span className="text-orange-400">{bossResult.decisionsOverridden} revisions</span>
                  )}
                  <span className="text-muted-foreground">{(bossResult.durationMs / 1000).toFixed(0)}s</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={bossRef} className="max-h-[350px] overflow-auto space-y-0.5">
              {bossThoughts.map((thought, i) => (
                <BossThoughtBubble key={thought.id} thought={thought} index={i} />
              ))}
              {bossRunning && (
                <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Boss is thinking...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pixel Office — animated agent workspace */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="size-4 text-muted-foreground" />
            Agent Floor — click an agent to see their conversations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PixelOffice
            agents={AGENTS.map((a) => ({
              id: a.id,
              name: a.name,
              role: a.role,
              color: a.color.includes("blue") ? "#3b82f6" : a.color.includes("emerald") ? "#10b981" : a.color.includes("purple") ? "#8b5cf6" : a.color.includes("amber") ? "#f59e0b" : a.color.includes("rose") ? "#ec4899" : a.color.includes("pink") ? "#ec4899" : "#eab308",
              skinColor: "#d4a574",
              hairColor: "#1a1a2e",
              deskX: a.id === "strategist" ? 1 : a.id === "copywriter" ? 3 : a.id === "designer" ? 5 : a.id === "analyst" ? 2 : a.id === "engagement_manager" ? 4 : a.id === "ugc_video" ? 0.5 : 3,
              deskY: ["strategist","copywriter","designer"].includes(a.id) ? 0.5 : a.id === "ugc_video" ? 2 : 2.5,
              state: (activeAgents.has(a.id) ? "working" : selectedAgent === a.id ? "talking" : "idle") as "working" | "talking" | "idle",
              emoji: a.avatar,
            }))}
            activeAgentId={selectedAgent}
            onAgentClick={handleAgentClick}
            className="rounded-none border-0"
          />
        </CardContent>
      </Card>

      {/* Conversation Panel + Activity Feed — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversation Panel */}
        <Card className={cn("transition-all duration-300", selectedAgent ? "ring-1 ring-foreground/10" : "")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              {selectedAgent
                ? `${AGENT_MAP[selectedAgent]?.name}'s Conversations`
                : "Select an agent to see conversations"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAgent && conversations.length > 0 ? (
              <div ref={chatRef} className="space-y-1 max-h-[400px] overflow-auto">
                {conversations.map((conv, i) => {
                  const from = AGENT_MAP[conv.from];
                  const to = AGENT_MAP[conv.to];
                  if (!from || !to) return null;
                  return (
                    <ChatBubble key={i} fromAgent={from} toAgent={to} message={conv.message} delay={i * 800} />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
                <div className="text-4xl mb-3">🏢</div>
                <p>Click an agent above to see how they</p>
                <p>collaborate with the rest of the team</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="size-4 text-yellow-500" />
              Live Activity Feed
              {feed.length > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-auto">{feed.length} recent</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feed.length > 0 ? (
              <div className="max-h-[400px] overflow-auto">
                {feed.map((item) => (
                  <ActivityFeedItem key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
                <div className="text-4xl mb-3">📋</div>
                <p>No activity yet.</p>
                <p className="text-xs mt-1">Run a daily cycle to see your agents in action</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workflow Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Daily Cycle Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[
              { agent: "analyst", step: "Review Performance" },
              { agent: "strategist", step: "Adjust Strategy" },
              { agent: "strategist", step: "Generate Briefs" },
              { agent: "copywriter", step: "Write Posts" },
              { agent: "designer", step: "Generate Images" },
              { agent: "ugc_video", step: "Create UGC Videos" },
              { agent: "engagement_manager", step: "Process Replies" },
            ].map((step, i) => {
              const a = AGENT_MAP[step.agent];
              return (
                <div key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ArrowRight className="size-3 text-muted-foreground shrink-0" />}
                  <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border", a?.bgColor, a?.borderColor)}>
                    <span className="text-sm">{a?.avatar}</span>
                    <span className={cn("font-medium", a?.color)}>{step.step}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
