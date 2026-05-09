'use client';

import { useChatStore } from '@/stores/chatStore';
import { AgentName } from '@/types/agent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AGENTS: { name: AgentName; label: string; description: string }[] = [
  { name: 'supervisor', label: '🎯 Supervisor', description: 'Route & coordinate' },
  { name: 'strategy', label: '📊 Strategy', description: 'Goals & campaigns' },
  { name: 'content', label: '✍️ Content', description: 'Draft & schedule' },
  { name: 'analytics', label: '📈 Analytics', description: 'Metrics & reports' },
  { name: 'engagement', label: '💬 Engagement', description: 'Replies & community' },
  { name: 'intelligence', label: '🔍 Intelligence', description: 'Trends & competitors' },
];

export function AgentSelector() {
  const { selectedAgent, setSelectedAgent } = useChatStore();

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-400">Select Agent</p>
      <div className="grid grid-cols-2 gap-2">
        {AGENTS.map((agent) => (
          <Button
            key={agent.name}
            variant={selectedAgent === agent.name ? 'default' : 'outline'}
            className="justify-start h-auto p-3 flex-col items-start"
            onClick={() => setSelectedAgent(agent.name)}
          >
            <span className="font-semibold">{agent.label}</span>
            <span className="text-xs text-gray-500">{agent.description}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
