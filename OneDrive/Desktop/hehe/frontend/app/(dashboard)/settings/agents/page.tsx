"use client";

import { Bot, Brain, Image, MessageSquare, PenLine, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const agents = [
  { name: "Strategist", icon: Brain, setting: "Review_required", note: "Regenerates monthly strategy and trend opportunities." },
  { name: "Copywriter", icon: PenLine, setting: "Review_required", note: "Writes posts, variants, captions, and translations." },
  { name: "Designer", icon: Image, setting: "Manual_only", note: "Creates images, covers, and carousel visuals." },
  { name: "Analyst", icon: TrendingUp, setting: "Full_autonomous", note: "Produces performance reports and recommendations." },
  { name: "Engagement", icon: MessageSquare, setting: "Review_required", note: "Suggests replies and auto-handles low-risk messages." },
];

export default function AgentSettingsPage() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal flex items-center gap-2">
          <Bot className="size-5" /> Agent Settings
        </h1>
        <p className="text-sm text-muted-foreground">Tune autonomy, notifications, and review rules for each specialist.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((agent) => (
          <Card key={agent.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <agent.icon className="size-4" /> {agent.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{agent.note}</p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{agent.setting.replace("_", " ")}</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
