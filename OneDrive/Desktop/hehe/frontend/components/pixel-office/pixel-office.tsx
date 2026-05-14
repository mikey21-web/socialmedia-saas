"use client";

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * Pixel Office — animated isometric workspace showing AI agents at work.
 * Each agent has a desk, a pixel avatar, and animated states (idle, working, talking).
 * The office has ambient animations (floating particles, blinking lights, scrolling screens).
 */

export type AgentState = "idle" | "working" | "talking" | "thinking" | "celebrating";

export interface PixelAgent {
  id: string;
  name: string;
  role: string;
  color: string;       // primary color for the agent
  skinColor: string;
  hairColor: string;
  deskX: number;       // position in the grid
  deskY: number;
  state: AgentState;
  emoji: string;
}

const DEFAULT_AGENTS: PixelAgent[] = [
  { id: "strategist", name: "Maya", role: "Strategist", color: "#3b82f6", skinColor: "#d4a574", hairColor: "#1a1a2e", deskX: 1, deskY: 0, state: "thinking", emoji: "🧠" },
  { id: "copywriter", name: "Alex", role: "Copywriter", color: "#10b981", skinColor: "#e8c4a0", hairColor: "#4a2c17", deskX: 3, deskY: 0, state: "working", emoji: "✍️" },
  { id: "designer", name: "Pixel", role: "Designer", color: "#8b5cf6", skinColor: "#c68642", hairColor: "#2d1b69", deskX: 5, deskY: 0, state: "working", emoji: "🎨" },
  { id: "analyst", name: "Nova", role: "Analyst", color: "#f59e0b", skinColor: "#d4a574", hairColor: "#0f172a", deskX: 2, deskY: 2, state: "idle", emoji: "📊" },
  { id: "engagement", name: "Echo", role: "Engagement", color: "#ec4899", skinColor: "#e8c4a0", hairColor: "#8b4513", deskX: 4, deskY: 2, state: "talking", emoji: "💬" },
  { id: "boss", name: "Diyaa", role: "CEO", color: "#eab308", skinColor: "#c68642", hairColor: "#1a1a1a", deskX: 3, deskY: 3.5, state: "thinking", emoji: "🤵" },
];

interface PixelOfficeProps {
  agents?: PixelAgent[];
  activeAgentId?: string | null;
  onAgentClick?: (agentId: string) => void;
  className?: string;
}

export function PixelOffice({ agents = DEFAULT_AGENTS, activeAgentId, onAgentClick, className }: PixelOfficeProps) {
  const [tick, setTick] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; speed: number; size: number }>>([]);

  // Animation tick (60fps-ish)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(interval);
  }, []);

  // Generate ambient particles
  useEffect(() => {
    const p = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 0.3 + Math.random() * 0.5,
      size: 2 + Math.random() * 3,
    }));
    setParticles(p);
  }, []);

  return (
    <div className={cn("relative w-full aspect-[16/9] bg-[#0f0a1e] rounded-2xl overflow-hidden border border-border/50", className)}>
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="pixel-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <rect width="24" height="24" fill="none" stroke="#6366f1" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pixel-grid)" />
        </svg>
      </div>

      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-[#1a1035] to-transparent" />

      {/* Ambient particles */}
      {particles.map((p) => {
        const y = (p.y + tick * p.speed * 0.5) % 100;
        return (
          <div
            key={p.id}
            className="absolute rounded-full bg-violet-400/20 animate-pulse"
            style={{
              left: `${p.x}%`,
              top: `${y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.id * 200}ms`,
            }}
          />
        );
      })}

      {/* Office title */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-widest">AI Office — Live</span>
      </div>

      {/* Agent desks */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: "85%", height: "75%" }}>
          {agents.map((agent) => (
            <PixelAgentDesk
              key={agent.id}
              agent={agent}
              tick={tick}
              isActive={activeAgentId === agent.id}
              onClick={() => onAgentClick?.(agent.id)}
            />
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className="flex gap-3">
          {agents.map((a) => (
            <div key={a.id} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "size-2 rounded-full",
                  a.state === "working" && "bg-emerald-400 animate-pulse",
                  a.state === "thinking" && "bg-amber-400 animate-pulse",
                  a.state === "talking" && "bg-blue-400 animate-pulse",
                  a.state === "idle" && "bg-gray-500",
                  a.state === "celebrating" && "bg-yellow-400 animate-bounce",
                )}
              />
              <span className="text-[9px] font-mono text-muted-foreground">{a.name}</span>
            </div>
          ))}
        </div>
        <span className="text-[9px] font-mono text-muted-foreground/50">
          tick:{tick}
        </span>
      </div>
    </div>
  );
}

/* ─── Individual Agent Desk ────────────────────────────────────────────────── */

function PixelAgentDesk({
  agent,
  tick,
  isActive,
  onClick,
}: {
  agent: PixelAgent;
  tick: number;
  isActive: boolean;
  onClick: () => void;
}) {
  // Position based on grid coordinates
  const left = `${(agent.deskX / 6.5) * 100}%`;
  const top = `${(agent.deskY / 4.5) * 100}%`;

  // Animation offsets based on state
  const bobOffset = agent.state === "working"
    ? Math.sin(tick * 0.5) * 2
    : agent.state === "thinking"
    ? Math.sin(tick * 0.3) * 1.5
    : agent.state === "talking"
    ? Math.sin(tick * 0.8) * 1
    : 0;

  const armOffset = agent.state === "working"
    ? Math.sin(tick * 0.7) * 3
    : 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute transition-all duration-200 group cursor-pointer",
        isActive && "scale-110 z-10",
      )}
      style={{ left, top, transform: `translate(-50%, -50%) translateY(${bobOffset}px)` }}
    >
      {/* Glow when active */}
      {isActive && (
        <div
          className="absolute -inset-4 rounded-full blur-xl opacity-30 animate-pulse"
          style={{ backgroundColor: agent.color }}
        />
      )}

      {/* Desk */}
      <div className="relative">
        {/* Monitor */}
        <div className="relative mx-auto w-14 h-10 bg-[#1a1a2e] border-2 border-[#2a2a4e] rounded-sm mb-1">
          {/* Screen content */}
          <div className="absolute inset-1 overflow-hidden rounded-sm">
            {agent.state === "working" && (
              <div className="w-full h-full bg-[#0a0a1a] flex flex-col gap-0.5 p-0.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 rounded-full"
                    style={{
                      backgroundColor: agent.color,
                      opacity: 0.6,
                      width: `${40 + Math.sin(tick * 0.3 + i) * 30}%`,
                      transition: "width 0.3s",
                    }}
                  />
                ))}
              </div>
            )}
            {agent.state === "thinking" && (
              <div className="w-full h-full bg-[#0a0a1a] flex items-center justify-center">
                <div className="text-[8px]" style={{ opacity: tick % 4 < 2 ? 1 : 0.3 }}>💭</div>
              </div>
            )}
            {agent.state === "talking" && (
              <div className="w-full h-full bg-[#0a0a1a] flex items-center justify-center">
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full"
                      style={{
                        backgroundColor: agent.color,
                        height: `${4 + Math.sin(tick * 0.6 + i * 1.5) * 4}px`,
                        transition: "height 0.2s",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {agent.state === "idle" && (
              <div className="w-full h-full bg-[#0a0a1a] flex items-center justify-center">
                <div className="size-1.5 rounded-full bg-gray-600" />
              </div>
            )}
          </div>
          {/* Monitor stand */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-[#2a2a4e] rounded-b-sm" />
        </div>

        {/* Desk surface */}
        <div className="w-20 h-3 bg-[#2a1f4e] rounded-sm border border-[#3a2f5e] mx-auto relative">
          {/* Keyboard */}
          <div className="absolute top-0.5 left-2 w-6 h-1.5 bg-[#1a1a2e] rounded-[1px]" />
          {/* Coffee mug */}
          <div className="absolute top-0 right-2 w-2 h-2 bg-[#4a3f6e] rounded-sm" />
        </div>

        {/* Character */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <PixelCharacter
            color={agent.color}
            skinColor={agent.skinColor}
            hairColor={agent.hairColor}
            state={agent.state}
            armOffset={armOffset}
            tick={tick}
          />
        </div>

        {/* Name tag */}
        <div className="mt-2 text-center">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
          >
            {agent.name}
          </span>
        </div>

        {/* State indicator bubble */}
        {agent.state !== "idle" && (
          <div
            className="absolute -top-12 left-1/2 -translate-x-1/2 text-sm animate-bounce"
            style={{ animationDuration: "2s" }}
          >
            {agent.state === "working" && "⚡"}
            {agent.state === "thinking" && "💭"}
            {agent.state === "talking" && "💬"}
            {agent.state === "celebrating" && "🎉"}
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-card border border-border rounded-lg px-2 py-1 shadow-lg whitespace-nowrap">
          <p className="text-[10px] font-semibold">{agent.name} — {agent.role}</p>
          <p className="text-[9px] text-muted-foreground capitalize">{agent.state}</p>
        </div>
      </div>
    </button>
  );
}

/* ─── Pixel Character Sprite ───────────────────────────────────────────────── */

function PixelCharacter({
  color,
  skinColor,
  hairColor,
  state,
  armOffset,
  tick,
}: {
  color: string;
  skinColor: string;
  hairColor: string;
  state: AgentState;
  armOffset: number;
  tick: number;
}) {
  // Eye blink
  const isBlinking = tick % 15 === 0;

  return (
    <svg width="20" height="24" viewBox="0 0 20 24" className="drop-shadow-lg">
      {/* Hair */}
      <rect x="5" y="0" width="10" height="4" fill={hairColor} rx="2" />
      <rect x="4" y="2" width="12" height="3" fill={hairColor} rx="1" />

      {/* Head */}
      <rect x="5" y="3" width="10" height="9" fill={skinColor} rx="2" />

      {/* Eyes */}
      {isBlinking ? (
        <>
          <rect x="7" y="7" width="2" height="1" fill="#1a1a1a" />
          <rect x="11" y="7" width="2" height="1" fill="#1a1a1a" />
        </>
      ) : (
        <>
          <rect x="7" y="6" width="2" height="2" fill="#1a1a1a" rx="0.5" />
          <rect x="11" y="6" width="2" height="2" fill="#1a1a1a" rx="0.5" />
          {/* Eye shine */}
          <rect x="7.5" y="6" width="1" height="1" fill="#ffffff" opacity="0.6" />
          <rect x="11.5" y="6" width="1" height="1" fill="#ffffff" opacity="0.6" />
        </>
      )}

      {/* Mouth */}
      {state === "talking" ? (
        <ellipse cx="10" cy="10" rx="1.5" ry={1 + Math.sin(tick * 0.8) * 0.5} fill="#1a1a1a" />
      ) : state === "celebrating" ? (
        <path d="M 8 9.5 Q 10 11.5 12 9.5" stroke="#1a1a1a" strokeWidth="0.8" fill="none" />
      ) : (
        <rect x="9" y="10" width="2" height="0.8" fill="#1a1a1a" rx="0.4" />
      )}

      {/* Body / shirt */}
      <rect x="5" y="12" width="10" height="8" fill={color} rx="1" />

      {/* Arms */}
      <rect
        x="2"
        y="13"
        width="3"
        height="6"
        fill={color}
        rx="1"
        style={{ transform: `rotate(${armOffset}deg)`, transformOrigin: "5px 13px" }}
      />
      <rect
        x="15"
        y="13"
        width="3"
        height="6"
        fill={color}
        rx="1"
        style={{ transform: `rotate(${-armOffset}deg)`, transformOrigin: "15px 13px" }}
      />

      {/* Hands */}
      <rect x="2" y="18" width="3" height="2" fill={skinColor} rx="1" />
      <rect x="15" y="18" width="3" height="2" fill={skinColor} rx="1" />

      {/* Legs */}
      <rect x="6" y="20" width="3" height="4" fill="#2a2a4e" rx="1" />
      <rect x="11" y="20" width="3" height="4" fill="#2a2a4e" rx="1" />
    </svg>
  );
}
